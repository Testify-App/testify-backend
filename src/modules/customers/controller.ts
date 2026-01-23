import * as dtos from './dto';
import CustomerServices from './services';
import { fnRequest } from '../../shared/types';
import { StatusCodes } from 'http-status-codes';

export class CustomerController {
  public createProfile: fnRequest = async (req, res) => {
    const fetchProfilePayload = new dtos.CreateProfileDto(req.body);
    const response = await CustomerServices.createProfile(
      fetchProfilePayload.profile_id,
    );
    res.status(StatusCodes.CREATED).send({ message: response });
  };
}

const customerController = new CustomerController();

export default customerController;
