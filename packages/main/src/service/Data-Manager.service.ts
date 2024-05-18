import {join} from 'node:path';
import prisma from '../prisma/prismaClient';
import ImageService from './Image.service';
import ExcelService from './Excel.service';
import {readdirSync, unlinkSync} from 'fs';
import {log} from 'node:console';
import type {Prisma} from '@prisma/client';
import {sendMessageToRenderer} from '../mainWindow';
import type {PointRate, getPointRateParam} from './Data-Manager.interface';

const TEMP_DIR = './temp';

class DataManagerService {
  private static instance: DataManagerService;
  private prisma = prisma;
  private imageService = ImageService;
  private excelService = ExcelService;
  private isImportRunning = false;
  private recordDir: string | undefined;

  constructor() {
    this.recordFolderScan();
    this.tempFolderCleanUp();
    this.loadRecordDirSetting();
  }

  private loadRecordDirSetting = async () => {
    const setting = await this.prisma.setting.findFirst();
    if (setting) {
      return (this.recordDir = setting.recordDir);
    }

    sendMessageToRenderer(
      'noti:error',
      'Record directory not set! Please set record directory in settings!',
    );
  };

  public getSetting = async () => {
    return await this.prisma.setting.findFirst();
  };

  public updateSetting = async (recordDir: string) => {
    const setting = await this.prisma.setting.findFirst();
    if (setting) {
      const _setting = this.prisma.setting.update({
        where: {id: setting.id},
        data: {recordDir},
      });
      this.recordDir = recordDir;
      sendMessageToRenderer(
        'noti:info',
        'record directory updated successfully! Please restart the application to apply changes!',
      );
      return _setting;
    }
    sendMessageToRenderer(
      'noti:info',
      'record directory updated successfully! Please restart the application to apply changes!',
    );
    this.recordDir = recordDir;
    return await this.prisma.setting.create({data: {recordDir}});
  };

  public static getInstance(): DataManagerService {
    if (!DataManagerService.instance) {
      DataManagerService.instance = new DataManagerService();
    }
    return DataManagerService.instance;
  }

  public getAllEntries = async (findOption: Prisma.DataEntryWhereInput) => {
    return await this.prisma.dataEntry.findMany({
      where: findOption,
      select: {
        id: true,
        recordId: true,
        weldingPoint: true,
        position: true,
        robotName: true,
        visionProResult: true,
        deepLearningResult: true,
        overallResult: true,
      },
    });
  };

  public getPointRate = async (param: getPointRateParam): Promise<PointRate[]> => {
    const {model, start, end} = param;
    const records = await this.getAllRecords({
      createdAt: {
        gte: new Date(start),
        lte: new Date(end),
      },
      model,
    });

    const recordIds = records.map(record => record.id);
    const entries = await this.getAllEntries({
      recordId: {
        in: recordIds,
      },
    });

    const pointSuccessRate: {
      [key: string]: {
        id: string;
        robotName: string;
        position: string;
        weldingPoint: string;
        visionproFailCount: number;
        deepLearningFailCount: number;
        overallFailCount: number;
        totalCount: number;
      };
    } = {};

    for (const entry of entries) {
      const {
        id,
        robotName,
        position,
        weldingPoint,
        visionProResult,
        deepLearningResult,
        overallResult,
      } = entry;
      const pointKey = `${robotName}-${position}-${weldingPoint}`;

      if (!pointSuccessRate[pointKey]) {
        pointSuccessRate[pointKey] = {
          id,
          robotName,
          position,
          weldingPoint,
          visionproFailCount: 0,
          deepLearningFailCount: 0,
          overallFailCount: 0,
          totalCount: 0,
        };
      }

      pointSuccessRate[pointKey].totalCount++;
      if (overallResult === 'NG') {
        pointSuccessRate[pointKey].overallFailCount++;
      }
      if (visionProResult === 'NG') {
        pointSuccessRate[pointKey].visionproFailCount++;
      }
      if (deepLearningResult === 'NG') {
        pointSuccessRate[pointKey].deepLearningFailCount++;
      }
    }

    return Object.entries(pointSuccessRate).map(
      ([
        _,
        {
          id,
          robotName,
          position,
          weldingPoint,
          overallFailCount,
          visionproFailCount,
          deepLearningFailCount,
          totalCount,
        },
      ]) => ({
        id,
        robotName,
        position,
        weldingPoint,
        overallFailRate: ((overallFailCount / totalCount) * 100).toFixed(0) as unknown as number,
        visionproFailRate: ((visionproFailCount / totalCount) * 100).toFixed(
          0,
        ) as unknown as number,
        deeplearningFailRate: ((deepLearningFailCount / totalCount) * 100).toFixed(
          0,
        ) as unknown as number,
      }),
    );
  };

  public tempFolderCleanUp = async () => {
    setInterval(() => {
      try {
        const files = readdirSync(TEMP_DIR);
        for (const file of files) {
          try {
            unlinkSync(join(TEMP_DIR, file));
          } catch (error) {
            log(error);
            continue;
          } // Delete files in temp folder
        }
      } catch (error) {
        log(error);
      }
    }, 1000 * 60 * 5); // Clean up temp folder every 24 hours
  };

  public recordFolderScan = async () => {
    setInterval(async () => {
      try {
        if (!this.isImportRunning && this.recordDir) {
          this.isImportRunning = true;
          const files = readdirSync(this.recordDir);
          const xlsFiles = files.filter(file => file.endsWith('.xlsx'));

          for (const fileName of xlsFiles) {
            if (await this.getUniqueRecord({fileName, finishImport: true})) {
              continue;
            }
            sendMessageToRenderer('record:save', fileName.replace('.xlsx', ''));
            await this.saveNewRecordToDB(fileName, this.recordDir);
          }
          this.isImportRunning = false;
        }
      } catch (error) {
        log(error);
      }
    }, 1000);
  };

  public getUniqueRecord = async (findOption: Prisma.RecordWhereUniqueInput) => {
    return await this.prisma.record.findUnique({
      where: findOption,
      select: {
        id: true,
        createdAt: true,
        fileName: true,
        model: true,
        partId: true,
      },
    });
  };

  public getEntry = async (findOption: Prisma.DataEntryWhereUniqueInput) => {
    return await this.prisma.dataEntry.findUnique({where: findOption});
  };

  public getAllDataEntries = async (findOption: Prisma.DataEntryWhereInput) => {
    const dataEntries = await this.prisma.dataEntry.findMany({
      where: findOption,
      select: {
        id: true,
        recordId: true,
        weldingPoint: true,
        position: true,
        robotName: true,
        visionProResult: true,
        deepLearningResult: true,
        overallResult: true,
      },
    });

    return dataEntries;
  };

  public getAllRecords = async (findOption: Prisma.RecordWhereInput) => {
    return await this.prisma.record.findMany({
      where: findOption,
      select: {
        id: true,
        createdAt: true,
        fileName: true,
        model: true,
        partId: true,
      },
    });
  };

  public async saveNewRecordToDB(fileName: string, recordDir: string) {
    const {model, partId} = this.excelService.extractExcelFileInfo(fileName);

    const {rawData, excelFileBuffer} = this.excelService.readDataFromExcel({
      dir: join(recordDir, fileName),
      sheetName: 'Sheet2',
      startCell: 'D678',
      numCols: 5,
      emptyRowsToCheck: 4,
    });
    let record = await this.getUniqueRecord({fileName});
    if (!record) {
      record = await this.prisma.record.create({
        data: {
          model,
          partId,
          excelFileBuffer,
          fileName,
        },
      });
    }

    try {
      await Promise.all([
        this.excelService.saveDataEntriesToDB(record.id, rawData),
        this.imageService.saveImageToDb(record.id, join(recordDir, fileName.replace('.xlsx', ''))),
      ]);
      await this.prisma.record.update({
        where: {id: record.id},
        data: {finishImport: true},
      });
    } catch (error) {
      this.prisma.record.delete({where: {id: record.id}});
      this.prisma.dataEntry.deleteMany({where: {recordId: record.id}});
    }
  }
}

export default DataManagerService;
