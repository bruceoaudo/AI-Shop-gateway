import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, 'user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

class UserClient {
    private client: any;

    constructor() {
        this.client = new userProto.UserService(
            'localhost:50051',
            grpc.credentials.createInsecure()
        );
    }

    loginUser(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.LoginUser(
                { email},
                (err: grpc.ServiceError, response: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }

    registerUser(fullName: string, userName: string, emailAddress: string, phoneNumber: string, password: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.RegisterUser(
                { fullName, userName, emailAddress, phoneNumber, password },
                (err: grpc.ServiceError, response: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }
}

export const userClient = new UserClient();