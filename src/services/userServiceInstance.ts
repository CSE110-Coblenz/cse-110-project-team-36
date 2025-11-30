import { BrowserStorageService } from './adapters/StorageService';
import { UserService } from './UserService';

/**
 * Default instance of UserService using browser localStorage
 * Components can use this instance directly
 */
export const userService = new UserService(new BrowserStorageService());

