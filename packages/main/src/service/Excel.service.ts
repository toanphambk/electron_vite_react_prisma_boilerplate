import prisma from '../prisma/prismaClient';
import type {ExcelReadParam, FileInfo} from './Data-Manager.interface';
import XLSX from 'xlsx';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {exec} from 'child_process';
import {log} from 'console';

const TEMP_DIR = './temp';

class ExcelService {
  private static instance: ExcelService;
  private prisma = prisma;
  constructor() {}

  public static getInstance(): ExcelService {
    if (!ExcelService.instance) {
      ExcelService.instance = new ExcelService();
    }
    return ExcelService.instance;
  }

  public saveDataEntriesToDB = async (recordId: string, data: string[][]) => {
    const mergedData = this.excelMergeRows(data);
    const overallResult = (deepLearningResult: string, visionProResult: string) => {
      if (deepLearningResult === 'NG' || visionProResult === 'NG') return 'NG';
      return 'OK';
    };
    const entries = mergedData.map(row => {
      return {
        recordId,
        robotName: row[0],
        position: row[1],
        weldingPoint: row[2],
        deepLearningResult: row[3],
        visionProResult: row[4],
        overallResult: overallResult(row[3], row[4]),
      };
    });
    return await this.prisma.$transaction(
      entries.map(entry => this.prisma.dataEntry.create({data: entry})),
    );
  };

  public readDataFromExcel(param: ExcelReadParam) {
    const {dir, sheetName, startCell, numCols, emptyRowsToCheck} = param;
    const excelFileBuffer = readFileSync(dir);
    const workbook = XLSX.read(excelFileBuffer, {type: 'buffer'});
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error(`Sheet ${sheetName} not found`);

    const {r: startRow, c: startCol} = XLSX.utils.decode_cell(startCell);

    const rawData: string[][] = [];
    let emptyRowCount = 0;

    for (let row = startRow; emptyRowCount < emptyRowsToCheck; row++) {
      const rowData: string[] = [];
      let rowIsEmpty = true;
      let skipRow = false;

      for (let col = startCol; col < startCol + numCols; col++) {
        const cellAddress = XLSX.utils.encode_cell({r: row, c: col});
        const cell = worksheet[cellAddress];
        const cellValue = cell ? (cell.w !== undefined ? cell.w : null) : null;

        rowData.push(cellValue);
        rowIsEmpty = rowIsEmpty && (cellValue === null || cellValue === '');

        if (col - startCol < 2 && (cellValue === null || cellValue === '')) {
          skipRow =
            rowData[0] === null || rowData[0] === '' || rowData[1] === null || rowData[1] === '';
        }
      }

      // Handle special splitting for the third column
      if (rowData[2] && typeof rowData[2] === 'string' && rowData[2].includes('-') && rowData[2]) {
        const prefixMatch = rowData[2].match(/^[^\d]+/); // Match non-digit characters at the start
        const prefix = prefixMatch ? prefixMatch[0] : ''; // Add null check
        const parts = rowData[2].split('-');
        const suffixMatch = rowData[2].match(/(\d+)([^\d]+)$/); // Match last digits followed by non-digits

        if (suffixMatch) {
          const suffix = suffixMatch[2]; // Capture suffix from last digits to end
          parts.forEach(part => {
            const numberMatch = part.match(/\d+/); // Match digits in the part
            if (numberMatch) {
              const newPart = `${prefix}${numberMatch[0]}${suffix}`;
              const newRow = [...rowData];
              newRow[2] = newPart.trim();
              if (!skipRow) rawData.push(newRow);
            }
          });
        }
      } else {
        if (!rowIsEmpty && !skipRow && rowData[1] !== 'NULL') {
          rowData[2] = rowData[2].trim();
          rawData.push(rowData);
        }
      }

      if (rowIsEmpty) {
        emptyRowCount++;
      } else {
        emptyRowCount = 0;
      }
    }
    return {rawData, excelFileBuffer};
  }

  private excelMergeRows = (data: string[][]): string[][] => {
    const grouped = new Map();

    data.forEach(row => {
      const key = row[0] + '-' + row[1] + '-' + row[2];
      if (row[5] !== 'OK') {
        row[5] = 'NG';
      }

      if (!grouped.has(key)) {
        grouped.set(key, [...row]);
      } else {
        const existingRow = grouped.get(key);
        row.forEach((cell, index) => {
          if (cell !== null) {
            existingRow[index] = cell;
          }
        });
        grouped.set(key, existingRow);
      }
    });
    return Array.from(grouped.values());
  };

  public openExelByID = async (id: string) => {
    try {
      const record = await prisma.record.findUnique({
        where: {id},
      });

      if (!record) {
        throw new Error('cant find excel file');
      }

      // Assuming the Excel file is stored in a blob column
      const excelBuffer = record.excelFileBuffer;

      // Write buffer to a local file
      const filePath = TEMP_DIR + `/${id}.xlsx`;

      if (!existsSync(TEMP_DIR)) {
        mkdirSync(TEMP_DIR);
      }

      writeFileSync(filePath, excelBuffer);

      // Open the file on your PC
      exec(`start "" "${filePath}"`, error => {
        throw error;
      });
    } catch (error) {
      log(error);
    }
  };

  public extractExcelFileInfo = (filename: string): FileInfo => {
    const parts = filename.split('_'); // Split filename at underscores
    let partId = parts.pop(); // Get the last part after the last underscore
    if (!partId) throw new Error('No part ID found in filename');

    // Remove the file extension from the part ID, if present
    partId = partId.replace(/\..+$/, '');

    const modelMatch = filename.match(/^(\w+)/); // Capture the model before the first space
    if (!modelMatch) throw new Error('Model not found in filename');

    return {
      model: modelMatch[1].toLocaleUpperCase(),
      partId: partId,
    };
  };
}

export default ExcelService.getInstance();
