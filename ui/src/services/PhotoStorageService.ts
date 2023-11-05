import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {AuthService} from "./AuthService.ts";
import {PhotoBucket} from "../../cdk-outputs.json";

export class PhotoStorageService {

    private authService: AuthService;
    private s3Client: S3Client | undefined;

    constructor(authService: AuthService) {
        this.authService = authService;
    }
    public async uploadPublicFile(file: File) : Promise<string> {
        const credentials = await this.authService.getTemporaryCredentials();
        if (!this.s3Client) {
            this.s3Client = new S3Client({
                credentials: credentials,
                region: AuthService.awsRegion
            });
        }
        const command = new PutObjectCommand({
            Bucket: PhotoBucket.FinderPhotosBucketName,
            Key: file.name,
            Body: file
        });
        await this.s3Client.send(command);
        return `https://${command.input.Bucket}.s3.${AuthService.awsRegion}.amazonaws.com/${command.input.Key}`
    }
}