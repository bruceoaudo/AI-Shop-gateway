import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, 'product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product as any;

class ProductClient {
  private client: any;

  constructor() {
    this.client = new productProto.ProductService(
      "localhost:50052",
      grpc.credentials.createInsecure()
    );
  }

getAllCategories(): Promise<{
    categories: Array<{ categoryId: string; name: string }>;
  }> {
    return new Promise((resolve, reject) => {
      this.client.GetAllCategories(
        {}, // Empty message - no email parameter needed according to proto
        (
          err: grpc.ServiceError,
          response: { categories: Array<{ categoryId: string; name: string }> }
        ) => {
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

export const productClient = new ProductClient();