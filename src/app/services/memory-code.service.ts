export interface IMountRecord {
    id: string;
    code: string;
}

// generate 24 character unique ID
export const generateUniqueId = (): string => {
    return Math.random().toString(36).substr(0, 36);
};

// generate 6 character code
export const generateCode = (): string => {
    return Math.random().toString(36).substr(2, 6);
};

const generateMemoryCode = (): IMountRecord => {
    return {
        id: generateUniqueId() + generateUniqueId(),
        code: generateCode()
    }
};

const generate10000MemoryCodes = (): IMountRecord[] => {
    const memoryCodes: IMountRecord[] = [];
    for (let i = 0; i < 10000; i++) {
        memoryCodes.push(generateMemoryCode());
    }
    return memoryCodes;
};

// write 10000 memory codes to a json file
// const codes = generate10000MemoryCodes();
// fs.writeFileSync('memory-codes.json', JSON.stringify(codes, null, 2));