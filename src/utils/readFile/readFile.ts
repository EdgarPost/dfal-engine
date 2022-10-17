import * as fs from 'fs';
import * as util from 'util';

const readFileAsync = util.promisify(fs.readFile);

export const readFile = async (filePath: string): Promise<string> => {
  const fileBuffer = await readFileAsync(filePath);

  return fileBuffer.toString();
};
