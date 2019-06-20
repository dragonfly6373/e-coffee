var ProductMgmtService = (function(db) {
	function _done(data, onSuccess, onFail) {
		if (data.error) onFail((data.error.message ? data.error.message : data.error));
		else onSuccess(data);
	}
	return {
		createCategory: function(category, onSuccess, onFail) {
			try {
				db.insert(Model.category, category, function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		getCategory: function(id, onSuccess, onFail) {
			try {
				db.getById(Model.Category, id, function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		listCategory: function(onSuccess, onFail) {
			try {
				db.getAll(Model.Category, Condition.eq("deleted", 0), function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		updateCategory: function(id, category, onSuccess, onFail) {
			try {
				var condition = Condition.eq(COLUMN_ID, id).and(Condition("deleted", 0));
				db.update(Model.Category, category, condition, function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		deleteCategory: function(id, onSuccess, onFail) {
			try {
				db.batchUpdate(Model.Category, {deleted: 1}, Condition.eq(COLUMN_ID, id), function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		}
		createProduct: function(product, onSuccess, onFail) {
			try {
				// TODO: check product.group_id is exist
				db.insert(Model.Product, product, function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		getProduct: function(id, onSuccess, onFail) {
			try {
				db.getById(Model.Product, id, function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		listProduct: function(category_id, onSuccess, onFail) {
			try {
				var condition = Condition.eq("group_id", category_id)
									.and(Condition.eq("deleted", 0));
				db.getAll(Model.Product, condition, function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		updateProduct: function(id, product, onSuccess, onFail) {
			try {
				db.update(Model.Product, product, Condition.eq(COLUMN_ID, id).and(Condition("deleted", 0)), function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		},
		deleteProduct: function(id, onSuccess, onFail) {
			try {
				db.batchUpdate(Model.Product, {deleted: 1}, Condition.eq(COLUMN_ID, id), function(data) {
					_done(data, onSuccess, onFail);
				});
			} catch(error) {
				onFail(error);
			}
		}
	}
})(window.__db);
