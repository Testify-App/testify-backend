import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import UploadsService from './services';
import { fnRequest } from '../../shared/types';
import { User } from '../../shared/interface';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class UploadsController {
  public createPresignedUpload: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.CreatePresignedUploadDTO(req.body);
    dto.user_id = req.user!.id;

    const response = await UploadsService.createPresignedUpload(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Presigned upload created successfully', StatusCodes.CREATED, response);
  };
}

const uploadsController = new UploadsController();
export default uploadsController;
