Websites = new Mongo.Collection("websites");
SearchWords = new EasySearch.Index({
	collection: Websites,
	fields: ['title', 'description'],
	engine: new EasySearch.Minimongo({
		sort: function () {
			return {rating: -1};}
	})
});

if (Meteor.isClient) {

	Router.route('/', function (){
		this.render('main-page');
	});

	Router.route('/site/:_id', function (){
		this.render('page-details', {
			data: function () {
				return Websites.findOne({"_id": this.params._id});
			}
		});
	});

	Meteor.subscribe('websites');

	/////
	// template helpers
	/////

	// helper function that returns all available websites
	Template.website_list.helpers({
		searchWords: function () { return SearchWords;},
	});

	Template['main-page'].helpers({
		isLogged: function () {
			if(Meteor.userId()) {
				return true;
			} else {
				return false;
			}
		}
	});

	Template.website_item.helpers({
		date: function () {
			// check if docs are fetched from db to avoid err messages at a console
			if(this.createdOn)
			return this.createdOn.toDateString();
		}
	});


	Template['page-details'].helpers({
		isLogged: function () {
			if(Meteor.userId()) {
				return true;
			} else {
				return false;
			}
		},
		date: function () {
			return this.createdOn.toDateString();
		}
	});

	/////
	// template events
	/////

	Template.website_item.events({
		"click .js-upvote":function(event){
			if(Meteor.userId()) {
				// example of how you can access the id for the website in the database
				// (this is the data context for the template)
				var website_id = this._id;
				// put the code in here to add a vote to a website!
				Websites.update(
					{"_id": website_id},
					{$inc: {"rating": 1}}
				);
				// prevent the button from reloading the page
				return false;
			}
		},
		"click .js-downvote":function(event){
			if(Meteor.userId()) {
				// example of how you can access the id for the website in the database
				// (this is the data context for the template)
				var website_id = this._id;
				// put the code in here to remove a vote from a website!
				Websites.update(
					{"_id": website_id},
					{$inc: {"rating": -1}}
				);
				return false;// prevent the button from reloading the page
			}
		}
	});

	Template.website_form.events({
		"click .js-toggle-website-form":function(event){
			$("#website_form").toggle('slow');
		},
		// autofill site information
		"blur #url": function (event) {
			var url = event.target.value;
			Meteor.call('getSiteInfo', url, function (err, result) {
				if(err) return console.log('please check if provided url is valid');
				document.getElementById('title').value = result.title;
				document.getElementById('description').value = result.description;
			});

		},
		"submit .js-save-website-form":function(event){

			// form data:
			var url = event.target.url.value,
					title = event.target.title.value,
					description = event.target.description.value;

			//  put your website saving code in here!

			Websites.insert({
				"title": title,
				"url": url,
				"description": description,
				"rating": 0,
				"createdOn": new Date()
			});

			// hide the form
			$('.js-toggle-website-form').click();

			// stop the form submit from reloading the page
			return false;

		}
	});

	Template.comment_form.events({
		"click .js-toggle-comment-form": function (event) {
			$("#comment-form").toggle('slow');
			return false;
		},
		"submit .js-save-comment-form": function (event) {
			var comment = event.target.comment.value;
			var username = Meteor.user().username;
			var commentDoc = {"comment": comment, "username": username};
			Websites.update({"_id": this._id}, {$push: {comments: commentDoc}});

			// hide the form after submitting
			$('.js-toggle-comment-form').click();

			// clear the comment field
			event.target.comment.value = '';

			// stop the form submit from reloading the
			return false;
		}
	});

	////////////////
	/// Meteor Packages Config
	///////////////////

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});
}


if (Meteor.isServer) {
	Websites.allow({
		insert: function (userId) {
			return userId ? true : false;
		},
		update: function (userId) {
			return userId ? true : false;
		}
	});

	Meteor.publish('websites', function () {
		return Websites.find();
	});

	Meteor.methods({
		// fetch site title and description
		getSiteInfo: function (url) {
			this.unblock();
			var siteContent = HTTP.call("GET", url).content;
			var siteDOM = cheerio.load(siteContent);
			var title = siteDOM('title').text();
			var description = siteDOM('meta[name=description]').attr("content");
			return {title: title, description: description};
		}
	});

	// start up function that creates entries in the Websites databases.
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Websites.findOne()){
    	console.log("No websites yet. Creating starter data.");
    	  Websites.insert({
    		title:"Goldsmiths Computing Department",
    		url:"http://www.gold.ac.uk/computing/",
    		description:"This is where this course was developed.",
				rating: 0,
    		createdOn:new Date()
    	});
    	 Websites.insert({
    		title:"University of London",
    		url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route",
    		description:"University of London International Programme.",
				rating: 0,
    		createdOn:new Date()
    	});
    	 Websites.insert({
    		title:"Coursera",
    		url:"http://www.coursera.org",
    		description:"Universal access to the world’s best education.",
				rating: 0,
    		createdOn:new Date()
    	});
    	Websites.insert({
    		title:"Google",
    		url:"http://www.google.com",
    		description:"Popular search engine.",
				rating: 0,
    		createdOn:new Date()
    	});
    }
  });
}
