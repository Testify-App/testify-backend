export interface CustomerRepository {
  createProfile(id: string): Promise<string>;
}

export class CustomerRepositoryImpl implements CustomerRepository {
  public async createProfile(id: string): Promise<string> {
    // fetch profile from db
    return `fetch profile from db: ${id}`;
  }
}

const customerRepository = new CustomerRepositoryImpl();

export default customerRepository;
