import customerRepository from './repositories';

export interface CustomerServices {
  createProfile(id: string): Promise<string>;
}

export class CustomerServiceImpl implements CustomerServices {
  public async createProfile(id: string): Promise<string> {
    const response = await customerRepository.createProfile(id);
    return response;
  }
}

const CustomerServices = new CustomerServiceImpl();

export default CustomerServices;
