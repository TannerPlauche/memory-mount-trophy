export interface IMountRecord {
    id: string;
    code: string;
}

export const generateUniqueId = (): string => {
    return Math.random().toString(36).substr(0, 36);
};

export const generateCode = (): string => {
    return Math.random().toString(36).substr(2, 6);
};

export const generateMemoryCode = (): IMountRecord => {
    return {
        id: generateUniqueId() + generateUniqueId(),
        code: generateCode()
    }
};
// const codes = generate10000MemoryCodes();
// fs.writeFileSync('memory-codes.json', JSON.stringify(codes, null, 2));