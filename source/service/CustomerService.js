var CustomerService = (function() {
	return {
		newCustomer: function(customer, onSuccess, onFail) {
			console.log("CustomerService - register new Customer");
		},
		getCustomer: function(id, onSuccess, onFail) {
			console.log("CustomerService - get Customer's information");
		}
	}
})(window.__db);