function Login() {
    BaseTemplatedWidget.call(this);
    this.bind("click", function() {
        Dialog.alert("User Login: " + this.itemUserName.value);
    }, this.actionSubmit);
}
__extend(BaseTemplatedWidget, Login);
