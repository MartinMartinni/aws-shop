export declare abstract class AbstractService<T> {
    protected url: string;
    protected websocketUrl: string;
    protected constructor(url: string);
    findAll(): Promise<T[]>;
    save(value: T): Promise<T>;
    update(id: string, value: T): Promise<T | undefined>;
    deleteById(id: string): Promise<void>;
}
