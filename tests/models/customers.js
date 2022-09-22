class Customers {
  customers = [];

  addCustomer(newCustomer) {
    this.customers.push(newCustomer);
    console.log(this.customers);
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(this.customers);
      }, 500)
    );
  }

  getCustomers() {
    return this.customers;
  }
}

module.exports = new Customers();
