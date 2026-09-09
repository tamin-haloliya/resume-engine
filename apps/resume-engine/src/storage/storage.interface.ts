import 'multer';

export interface StorageService {
  save(file: Express.Multer.File, key: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  read(key: string): Promise<Buffer>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
