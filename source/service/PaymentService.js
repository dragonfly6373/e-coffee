var PaymentService = (function() {
	function createOrder(order) {
		return false;
	}
	funtion listOrder(fromDate, toDate) {
		return [];
	}
	function orderDetail(id) {
		return {};
	}
	function updateOrder(id, order) {
		return false;
	}
	return {
		createOrder: createOrder,
		listOrder: listOrder,
		orderDetail: orderDetail,
		updateOrder: updateOrder
	}
})();