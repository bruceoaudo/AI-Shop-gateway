import { Request, Response, Router } from "express";
import { productClient } from "../grpc/productClient";

const router = Router()

router.get("/categories", (req: Request, res: Response) => {
  (async () => {
    try {
      // Call the gRPC service to get all categories
      const response = await productClient.getAllCategories();

      // Send the categories array in the response
      res.status(200).json({
        success: true,
        data: response.categories,
      });
    } catch (error: any) {
      console.error("Error fetching categories:", error);

      // Handle gRPC errors
      if (error.code && error.message) {
        res.status(500).json({
          success: false,
          message: `gRPC error: ${error.message}`,
          code: error.code,
        });
      } else {
        // Handle other types of errors
        res.status(500).json({
          success: false,
          message: "Internal server error while fetching categories",
        });
      }
    }
  })();
});

export default router;