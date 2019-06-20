var PaymentService = (function() {
	function createOrder(order) {
		console.log("PaymentService - createOrder");
		return false;
	}
	funtion listOrder(fromDate, toDate) {
		console.log("PaymentService - listOrder");
		return [];
	}
	function orderDetail(id) {
		console.log("PaymentService - orderDetail");
		return {};
	}
	function updateOrder(id, order) {
		console.log("PaymentService - updateOrder");
		return false;
	}
	return {
		createOrder: createOrder,
		listOrder: listOrder,
		orderDetail: orderDetail,
		updateOrder: updateOrder
	}
})();