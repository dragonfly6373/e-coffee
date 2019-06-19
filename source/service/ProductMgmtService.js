var ProductMgmtService = (function() {
	function createProduct(product, onSuccess, onFail) {
		return new Promise(function(resolve, reject) {
			DataAdapter.insert(Model.Product, product, function(error) {

			});
		})
	}
	function get(id, onSuccess, onFail) {
		DataAdapter.getById(Model.Product, id);
		ruturn {};
	}
	function list(condition, onSuccess, onFail) {
		return [];
	}
	function update(id, product, onSuccess, onFail) {
		return true;
	}
	function delete(id, onSuccess, onFail) {
		return true;
	}
	return {
		get: get,
		list: list,
		update: update,
		delete: delete
	};
})();
