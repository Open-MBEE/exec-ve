const ADMIN = 'ADMIN';
const WRITE = 'WRITER';
const READ = 'READER';
const NONE = 'NONE';

// const Role: VeRole = {
//     ADMIN,
//     WRITE,
//     READ,
//     NONE,
// };

const RoleMod = {
    ADMIN: 3,
    WRITE: 2,
    READ: 1,
    NONE: 0,
};

const roleValue = (role: VeRole['ANY']): number => {
    switch (role) {
        case ADMIN: {
            return RoleMod.ADMIN;
        }
        case WRITE: {
            return RoleMod.WRITE;
        }
        case READ: {
            return RoleMod.READ;
        }
        case NONE: {
            return RoleMod.NONE;
        }
        default: {
            return RoleMod.NONE;
        }
    }
};

export class Role {
    static ADMIN: VeRole['ADMIN'] = ADMIN;
    static WRITE: VeRole['WRITE'] = WRITE;
    static READ: VeRole['READ'] = READ;
    static NONE: VeRole['NONE'] = NONE;

    static gt(role1: VeRole['ANY'], role2: VeRole['ANY']): boolean {
        return roleValue(role1) > roleValue(role2);
    }

    static lt(role1: VeRole['ANY'], role2: VeRole['ANY']): boolean {
        return roleValue(role1) < roleValue(role2);
    }

    static eq(role1: VeRole['ANY'], role2: VeRole['ANY']): boolean {
        return roleValue(role1) == roleValue(role2);
    }

    static ge(role1: VeRole['ANY'], role2: VeRole['ANY']): boolean {
        return roleValue(role1) >= roleValue(role2);
    }

    static le(role1: VeRole['ANY'], role2: VeRole['ANY']): boolean {
        return roleValue(role1) <= roleValue(role2);
    }
}

export default Role;

export interface VeRole {
    ADMIN: typeof ADMIN;
    WRITE: typeof WRITE;
    READ: typeof READ;
    NONE: typeof NONE;
    ANY?: typeof ADMIN | typeof WRITE | typeof READ | typeof NONE;
}
