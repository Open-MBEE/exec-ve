const ADMIN = 'ADMIN';
const WRITE = 'WRITER';
const READ = 'READER';
const NONE = 'NONE';

const Role: VeRole = {
    ADMIN,
    WRITE,
    READ,
    NONE,
};

export default Role;

export interface VeRole {
    ADMIN: typeof ADMIN;
    WRITE: typeof WRITE;
    READ: typeof READ;
    NONE: typeof NONE;
    ANY?: typeof ADMIN | typeof WRITE | typeof READ | typeof NONE;
}
