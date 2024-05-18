import sharpBmp from 'sharp-bmp';
import sharp from 'sharp';

import prisma from '../prisma/prismaClient';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import pLimit from 'p-limit';
import type {Prisma} from '@prisma/client';
import {sendMessageToRenderer} from '../mainWindow';

export class ImgService {
  private static instance: ImgService;
  private prisma = prisma;

  public static getInstance(): ImgService {
    if (!ImgService.instance) {
      ImgService.instance = new ImgService();
    }
    return ImgService.instance;
  }

  public getOne = async (option: Prisma.ImageWhereInput) => {
    return await this.prisma.image.findFirst({where: option});
  };

  public saveImageToDb = async (recordId: string, imageDir: string) => {
    const imageNames = readdirSync(imageDir);
    const totalImages = imageNames.length;
    let savedImages = 0;
    const limit = pLimit(2); // Limit the number of concurrent image processing tasks

    return Promise.all(
      imageNames.map(imageName =>
        limit(async () => {
          const imagePath = join(imageDir, imageName);
          const {robotName, position} = this.getIdentifiersFromName(imageName);

          const existingImage = await this.prisma.image.findFirst({
            where: {
              recordId,
              robotName,
              position,
            },
          });

          if (!existingImage) {
            const imageBuffer = await this.scaleImageAndGetBuffer(imagePath, 300);
            await this.prisma.image.create({
              data: {
                recordId,
                imageBuffer,
                robotName,
                position,
              },
            });
          }

          savedImages++;
          const percentage = (savedImages / totalImages) * 100;
          sendMessageToRenderer('image:saveProgress', percentage.toFixed(0));
        }),
      ),
    );
  };

  private scaleImageAndGetBuffer = async (
    filePath: string,
    targetSize: number,
  ): Promise<Buffer> => {
    const buffer = readFileSync(filePath);
    const bitmap = sharpBmp.decode(buffer);
    return sharp(bitmap.data, {
      raw: {
        width: bitmap.width,
        height: bitmap.height,
        channels: 4,
      },
    })
      .resize(targetSize)
      .toFormat('png')
      .toBuffer();
  };

  private getIdentifiersFromName(fileName: string) {
    // Regular expression to match a robot pattern like "C1"
    const robotPattern = /C\d+/;
    const robotMatch = fileName.match(robotPattern);
    // Regular expression to match a position pattern like "P77"
    const positionPattern = /P\d+/;
    const positionMatch = fileName.match(positionPattern);

    if (positionMatch && robotMatch) {
      const robotName = robotMatch[0];
      const position = positionMatch[0];
      return {robotName, position};
    } else {
      throw new Error('Invalid file name');
    }
  }
}

export default ImgService.getInstance();
