import glob from 'glob';
import path from 'path';
import * as util from 'util';

const readMarkdown = util.promisify(glob);

export const getMarkdownFiles = async (
  directory: string = 'data/**/*.md'
): Promise<string[]> => {
  const files = await readMarkdown(directory);

  return files.filter((f) => !f.includes('node_modules'));
};
