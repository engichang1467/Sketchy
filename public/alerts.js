$('.alert').on('click', '.close-icon', function(e) {
    var $alert = e.delegateTarget;
    $('.alert', $alert).hide();
});