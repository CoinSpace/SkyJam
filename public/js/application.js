function Application(config)
{
	
	this.config = config;
	
	var self = this;
	
	this.searchInterval = null;
	
	this.previousHeaderFormSearch = null; 
	
	this.bodyContentSelector = "#body-content";
	
	this.pjaxAdditionalFragments = [ "#user-top-menu" ];
	
	this.jCurrentForm = null;
	
	this.user = null;
	
	this.getUser = function ()
	{
		return self.user;
	};
	
	this.setUser = function (newUser)
	{
		this.user = newUser;
		$.event.trigger("application:user", [ this.user ]);
	};
	
	this.autocompleteItemRender = function( ul, item ) {
		
		var maxDescriptionChars = 100;
		var description = item.description.substring(0,maxDescriptionChars);
		
		if( item.description.length > maxDescriptionChars)
		{
			description += "...";
		}
		
		var artistsMaxChars = 80;
		
		var artists = item.artists.join(", ");
		
		var artistsText = "With Artists: "+(  artists.length > artistsMaxChars ? ( artists.substring(0, artistsMaxChars)+"..." ) : artists );
		
		return $( "<li></li>" )
			.addClass('playlistSearchDropdown')
			.data( "item.autocomplete", item )
			.append( 
					$("<a>")
						.append( $("<span>").addClass("name").text( item.label ) )
						.append( $("<span>").addClass("artists").text(artistsText) )
						.append( $("<span>").addClass("description").text( description) )
			)
			
			.appendTo( ul );
		
	};		
	
	this.disableForm = function($form)
	{
		$form = $($form);
		$("input, select, textarea").each( function(){
			var $this = $(this);

			$this.data("previous-disabled-state", $this.prop("disabled") );

			$this.prop("disabled", true);
		});
		
		
		
	};
	
	this.refreshAuthUser = function()
	{
		$.get( self.config.urls.getAuthUser, {}, function(data, textStatus, jqXHR){
			
			self.setUser(data);
			
		}, "json" );
	}
	
	this.enableForm = function($form)
	{
		$form = $($form);
		$("input, select, textarea").each(function(){
			var $this = $(this);
			
			if( !$this.data("previous-disabled-state") )
			{
				$this.prop("disabled", false);
			}
				
		});
		
	};
	
	this.stripPjaxParam = function (url) {
		  return url
		    .replace(/\?_pjax=[^&]+&?/, '?')
		    .replace(/_pjax=[^&]+&?/, '')
		    .replace(/[\?&]$/, '')
	}
	
	
	this.onFormBeforeSubmit = function(formFields, $form, options)
	{
		self.jCurrentForm = $form;
		
		self.disableForm($form);
		
		return true;
	};
	
	this.processPjaxRedirect = function(xhr)
	{
		var redirectUrl = xhr.getResponseHeader('X-PJAX-REDIRECT');
		
		
		if( redirectUrl && ( !xhr.pjaxRedirected  ) )
		{
			// emulate pjax click
			
			xhr.pjaxRedirected = true;
			
			var a = $("<a>").attr("href", redirectUrl).click( 
					function(e){ 
						e.preventDefault(); 
						return false; 
					}
			);
			
			var event = jQuery.Event("click");
			event.currentTarget = a[0];
			
			
			// ajax navigation
				
			$.pjax.click(event, container, {fragment : self.bodyContentSelector });
			
			
			
			return true;
			
		}	
		
		return false;
	}

	
	this.onFormSubmitSuccess = function(responseText, statusText, xhr, $form)
	{
		self.enableForm($form);

		if( $form.attr("id") == "user-sign-in" )
		{
			// refresh the user data
			self.refreshAuthUser();
		}
		
		/*
		if( self.processPjaxRedirect(xhr) )
		{
			return true;
		}
		*/
		
		// process redirect and page fragments
		self.onPjaxComplete(null, xhr, statusText);
		
		// push state
		if($.support.pjax)
		{
			
			var formActionUrl = $form.attr("action");
			
			var pageUrl = self.stripPjaxParam(xhr.getResponseHeader('X-PJAX-URL') || formActionUrl );
			
			var strResponseTitle = "";
			
			var pjaxState = {
				      id: "form_"+(new Date).getTime(),
				      url: pageUrl,
				      title: strResponseTitle,
				      container: this.target,
				      fragment: this.fragment,
				      timeout: 0
				   
			};

			
			window.history.pushState(pjaxState, strResponseTitle, pageUrl);
			
		}		
		
		
		if( responseText )
		{
			
			// self.updatePageFragments(responseText, ["title", self.bodyContentSelector ].concat(self.pjaxAdditionalFragments) );
			self.updatePageFragments(responseText, [ self.bodyContentSelector ] );
		}
		
		self.jCurrentForm = null;
		
	};
	
	this.updatePageFragments = function(responseText, pageFragments)
	{
		var jResponseText = jQuery.parseHtmlPage(responseText);
		
		// update the user menu if exists
		if( pageFragments )
		{
			for(var i=0; i<pageFragments.length; i++)
			{
				var $fragment = $( pageFragments[i], jResponseText );
				if($fragment.length)
				{
					$( pageFragments[i]).html($fragment);
				}
			}
		}		
	}
	
	this.onPjaxComplete = function(event, xhr, textStatus, options)
	{

		if( ( textStatus == "success" ) )
		{
		
			if( self.processPjaxRedirect(xhr) )
			{
				return true;
			}
			
			self.updatePageFragments(xhr.responseText, ["title" ].concat(self.pjaxAdditionalFragments));

		}
		
		
		// logout
		if( event )
		{
			event.preventDefault();
			
			if( event.relatedTarget && $(event.relatedTarget).is(".logout") )
			{
				self.refreshAuthUser();
			}
			
		}
		
		
	};
	
	this.onPjaxError = function(e, xhr, textStatus, errorThrown, options)
	{
		e.preventDefault();
		
		if( xhr.responseText )
		{
			// display the error body
			  var re = /<body[\s\S]*\/body>/;
			  var check=data.match(re);
			  
			  if(check && check.length>0) 
			  {
				  check=check[0].replace(/^<body/, '<div');
				  check=check.replace(/body>$/, 'div>');

			  } 
			  else 
			  {
				  check=data;  
			  }
			  
			$data = $(check);
			
			if(jResponseTextFragment.length)
			{
				$( self.bodyContentSelector ).html( jResponseTextFragment );
			}
			
			
		}
		
		
		return false;
	};
	
	
	// this is quick and dirty implementation
	this.onDomReady = function()
	{
		
		var inputHeaderFormSearch = "header form input:text" ;
		
		if( $(inputHeaderFormSearch).length )
		{
			var cache = {}, lastXhr;
			
			var inputHeaderFormSearchJq = $( inputHeaderFormSearch ).autocomplete({
				
				minLength: 0,
				source: function( request, response ) {
					
					var term = request.term;
					
					/*
					if ( term in cache ) {
						response( cache[ term ] );
						return;
					}
					*/

					lastXhr = $.getJSON( config.urls.headerFormSearch, request, function( data, status, xhr ) {
						
						// cache[ term ] = data;
						
						if ( xhr === lastXhr ) {
							response( data );
						}
					});
				},
					
					
				focus: function( event, ui ) {
					$( inputHeaderFormSearch ).val( ui.item.label );
					return false;
				},
				select: function( event, ui ) {
					
					window.location = self.config.urls.playlist.replace("0", ui.item.id);
					
					return false;
				}
			});
			
			inputHeaderFormSearchJq.data( "autocomplete" )._renderItem = this.autocompleteItemRender;			
		}
		
		
		
		if( application.config.pjax )
		{
			
			var pjaxContainer = $(self.bodyContentSelector);
			pjaxContainer.on('pjax:complete', self.onPjaxComplete);		
			pjaxContainer.on('pjax:error', self.onPjaxError);
			
			// ajax navigation
			$(document).on('click', 'a:not(.no-pjax):not(#player > *)', function(event) {
				
				$.pjax.click(event, pjaxContainer, {
					fragment : self.bodyContentSelector,	
					timeout: 0
				});
				
				return false;
			});			
			
			
			// on logout click
			$(document).on( "click", "#user-top-menu .logout", function(event){
				
				var logoutUrl = $(this).attr("href");
				
				$.get( logoutUrl, {}, function(data, textStatus, jqXHR){
					
					self.updatePageFragments(data, self.pjaxAdditionalFragments);
					self.refreshAuthUser();
					
				});
				
				/*
				var container = $(self.bodyContentSelector);
				container.on('pjax:complete', function(){
					// on logout done
					self.setUser(null);
				});
				$.pjax.click(event, container, {
					fragment : self.bodyContentSelector
				});
				*/
				return false;
			});
			
			$(document).on("submit", "form:not(.no-pjax)", function(event){
		        	
		            event.preventDefault();
		            
		            var pjaxAction = URI($(this).attr("action"));
		            pjaxAction.addSearch("_pjax", "form");
		            
		            $(this).attr("action", pjaxAction.toString() );
		            
		            $(this).ajaxSubmit({
		    			replaceTarget: 	true,
		    			// delegation: 	true,
		    			dataType:		"html",
		    			target: 		self.bodyContentSelector,
		    			fragment: 		self.bodyContentSelector,

		    			beforeSubmit: 	self.onFormBeforeSubmit,
		    			success: 		self.onFormSubmitSuccess

		            });
		        			
			});			
		}
		

		

	};
	
	if( config.user )
	{
		this.setUser(config.user);
	}
};


jQuery.parseHtmlPage = function(htmlString){
		
	  // empty set
	  var results = $();
	
	  var reBody = /<body[\s\S]*\/body>/;
	  var body=htmlString.match(reBody);
	  
	  if(body && body.length>0) 
	  {
		  body=body[0].replace(/^<body/, '<div');
		  body=body.replace(/body>$/, 'div>');

	  } 
	  else 
	  {
		  body=htmlString;  
	  }
	  
	  results = results.add( $(body).addClass("bodyTag") );
	
	  var reHead = /<head[\s\S]*\/head>/;
	  var head=htmlString.match(reHead);
	  
	  if(head && head.length>0) 
	  {
		  head=head[0].replace(/^<head/, '<div');
		  head=head.replace(/head>$/, 'div>');
		  
		  results = results.add( $(head).addClass("headTag") );
		   

	  } 
	  else 
	  {
		    
	  }
	  
	  return results;
	
}

