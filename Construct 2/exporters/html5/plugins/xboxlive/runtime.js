"use strict";

/////////////////////////////////////
// Plugin class
cr.plugins_.XboxLive = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	// Check WinRT APIs are supported
	var isWinRT = !!window["Windows"];
	var Microsoft = window["Microsoft"];
	var MicrosoftXbox = null;
	var MicrosoftXboxServices = null;
	var xboxUser = null;
	var xboxLiveContext = null;
	
	// Saved profile info
	var profileAppDisplayName = "";
	var profileGameDisplayName = "";
	var profileAppPictureUri = "";
	var profileGamePictureUri = "";
	var profileGamerScore = "";
	
	var isXboxLiveAvailable = (isWinRT && Microsoft && Microsoft["Xbox"] && Microsoft["Xbox"]["Services"]);
	if (isXboxLiveAvailable)
	{
		MicrosoftXbox = Microsoft["Xbox"];
		MicrosoftXboxServices = MicrosoftXbox["Services"];
	}
	
	var pluginProto = cr.plugins_.XboxLive.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		
		this.errorMessage = "";
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created
	instanceProto.onCreate = function()
	{
		// Verify Xbox Live APIs are available
		if (isWinRT)
		{
			if (isXboxLiveAvailable)
			{
				console.info("[Xbox Live] Xbox Live Services appear to be available.");
			}
			else
			{
				console.warn("[Xbox Live] WinRT is available, but Xbox Live is not available. Check the SDK dependencies are configured.");
			}
		}
		else
		{
			console.warn("[Xbox Live] WinRT is not available. Export as UWP app to use Xbox Live features.");
		}
	};
	
	// called whenever an instance is destroyed
	// note the runtime may keep the object after this call for recycling; be sure
	// to release/recycle/reset any references to other objects in this function.
	instanceProto.onDestroy = function ()
	{
	};
	
	// called when saving the full state of the game
	instanceProto.saveToJSON = function ()
	{
		// return a Javascript object containing information about your object's state
		// note you MUST use double-quote syntax (e.g. "property": value) to prevent
		// Closure Compiler renaming and breaking the save format
		return {
			// e.g.
			//"myValue": this.myValue
		};
	};
	
	// called when loading the full state of the game
	instanceProto.loadFromJSON = function (o)
	{
		// load from the state previously saved by saveToJSON
		// 'o' provides the same object that you saved, e.g.
		// this.myValue = o["myValue"];
		// note you MUST use double-quote syntax (e.g. o["property"]) to prevent
		// Closure Compiler renaming and breaking the save format
	};
	// The comments around these functions ensure they are removed when exporting, since the
	// debugger code is no longer relevant after publishing.
	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections)
	{
		// Append to propsections any debugger sections you want to appear.
		// Each section is an object with two members: "title" and "properties".
		// "properties" is an array of individual debugger properties to display
		// with their name and value, and some other optional settings.
		/*
		propsections.push({
			"title": "My debugger section",
			"properties": [
				// Each property entry can use the following values:
				// "name" (required): name of the property (must be unique within this section)
				// "value" (required): a boolean, number or string for the value
				// "html" (optional, default false): set to true to interpret the name and value
				//									 as HTML strings rather than simple plain text
				// "readonly" (optional, default false): set to true to disable editing the property
				
				// Example:
				// {"name": "My property", "value": this.myValue}
			]
		});
		*/
	};
	
	instanceProto.onDebugValueEdited = function (header, name, value)
	{
		// Called when a non-readonly property has been edited in the debugger. Usually you only
		// will need 'name' (the property name) and 'value', but you can also use 'header' (the
		// header title for the section) to distinguish properties with the same name.
		//if (name === "My property")
		//	this.myProperty = value;
	};
	/**END-PREVIEWONLY**/

	//////////////////////////////////////
	// Conditions
	function Cnds() {};

	Cnds.prototype.IsXboxLiveAvailable = function ()
	{
		return isXboxLiveAvailable;
	};
	
	Cnds.prototype.OnSignInSuccess = function ()
	{
		return true;
	};
	
	Cnds.prototype.OnSignInError = function ()
	{
		return true;
	};
	
	Cnds.prototype.IsSignedIn = function ()
	{
		return xboxUser && xboxUser["isSignedIn"];
	};
	
	Cnds.prototype.OnPresenceUpdateSuccess = function ()
	{
		return true;
	};
	
	Cnds.prototype.OnPresenceUpdateError = function ()
	{
		return true;
	};
	
	Cnds.prototype.OnProfileInfoSuccess = function ()
	{
		return true;
	};
	
	Cnds.prototype.OnProfileInfoError = function ()
	{
		return true;
	};
	
	pluginProto.cnds = new Cnds();
	
	//////////////////////////////////////
	// Actions
	function Acts() {};

	Acts.prototype.SignIn = function ()
	{
		if (!isXboxLiveAvailable || xboxUser)
			return;
		
		var self = this;
		xboxUser = new MicrosoftXboxServices["System"]["XboxLiveUser"]();
		xboxUser["signInAsync"](null).then(function (signInResult)
		{
			if (signInResult["status"] == MicrosoftXboxServices["System"]["SignInStatus"]["success"])
			{
				xboxLiveContext = new MicrosoftXboxServices["XboxLiveContext"](xboxUser);
				self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnSignInSuccess, self);
			}
			else
			{
				self.errorMessage = "" + signInResult["status"];
				self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnSignInError, self);
			}
		}, function (err)
		{
			self.errorMessage = err["message"];
			self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnSignInError, self);
		});
	};
	
	Acts.prototype.SetPresence = function (p)
	{
		if (!isXboxLiveAvailable || !xboxLiveContext)
			return;
		
		var self = this;
		xboxLiveContext["presenceService"]["setPresenceAsync"](!!p).then(function ()
		{
			self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnPresenceUpdateSuccess, self);
		}, function (err)
		{
			self.errorMessage = err["message"];
			self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnPresenceUpdateError, self);
		});
	};
	
	Acts.prototype.RequestProfileInfo = function ()
	{
		if (!isXboxLiveAvailable || !xboxLiveContext)
			return;
		
		var self = this;
		xboxLiveContext["profileService"]["getUserProfileAsync"](xboxUser["xboxUserId"]).then(function (profileResult)
		{
			profileAppDisplayName = profileResult["applicationDisplayName"];
			profileGameDisplayName = profileResult["gameDisplayName"];
			profileAppPictureUri = profileResult["applicationDisplayPictureResizeUri"].toString();
			profileGamePictureUri = profileResult["gameDisplayPictureResizeUri"].toString();
			profileGamerScore = profileResult["gamerscore"];
			self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnProfileInfoSuccess, self);
		}, function (err)
		{
			self.errorMessage = err["message"];
			self.runtime.trigger(cr.plugins_.XboxLive.prototype.cnds.OnProfileInfoError, self);
		});
	};
	
	pluginProto.acts = new Acts();
	
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	
	Exps.prototype.ErrorMessage = function (ret)
	{
		ret.set_string(this.errorMessage);
	};
	
	Exps.prototype.AgeGroup = function (ret)
	{
		ret.set_string(xboxUser ? xboxUser["ageGroup"] : "");
	};
	
	Exps.prototype.GamerTag = function (ret)
	{
		ret.set_string(xboxUser ? xboxUser["gamertag"] : "");
	};
	
	Exps.prototype.WebAccountId = function (ret)
	{
		ret.set_string(xboxUser ? xboxUser["webAccountId"] : "");
	};
	
	Exps.prototype.XboxUserId = function (ret)
	{
		ret.set_string(xboxUser ? xboxUser["xboxUserId"] : "");
	};
	
	Exps.prototype.UserAppDisplayName = function (ret)
	{
		ret.set_string(profileAppDisplayName);
	};
	
	Exps.prototype.UserGameDisplayName = function (ret)
	{
		ret.set_string(profileGameDisplayName);
	};
	
	Exps.prototype.UserAppDisplayPictureUri = function (ret)
	{
		ret.set_string(profileAppPictureUri);
	};
	
	Exps.prototype.UserGameDisplayPictureUri = function (ret)
	{
		ret.set_string(profileGamePictureUri);
	};
	
	Exps.prototype.GamerScore = function (ret)
	{
		ret.set_string(profileGamerScore);
	};
	
	pluginProto.exps = new Exps();

}());