var keyValue = "Key Value";

// main-page
exports.main = function(req, res){
	req.params
	res.render('main', {keyValue : keyValue});
};

exports.searchItem = function(req, res){
	var newItem = req.body.newItem;
	console.log(newItem);
	keyValue = newItem;
	res.redirect('/');
};

exports.notFound = function(req, res){
	res.send('404');
};

