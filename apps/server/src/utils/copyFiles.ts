import fs from 'fs';
import { copyFile } from 'fs/promises';

type targetToDestArrayType = { from: string; to: string }[];

/**
 * @param targetToDestArray 传入数组 [{ from: string; to: string }...]
 */
export const copyFiles = async (targetToDestArray: targetToDestArrayType) => {
  for await (const item of targetToDestArray) {
    await copyFile(item.from, item.to, fs.constants.COPYFILE_FICLONE);
  }
};
