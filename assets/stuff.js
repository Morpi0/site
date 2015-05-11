(function($){function fnPjax(selector,container,options){var context=this;return this.on("click.pjax",selector,function(event){var opts=$.extend({},optionsFor(container,options));if(!opts.container)opts.container=$(this).attr("data-pjax")||context;handleClick(event,opts)})}function handleClick(event,container,options){options=optionsFor(container,options);var link=event.currentTarget;if(link.tagName.toUpperCase()!=="A")throw"$.fn.pjax or $.pjax.click requires an anchor element";if(event.which>1||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;if(location.protocol!==link.protocol||location.hostname!==link.hostname)return;if(link.hash&&link.href.replace(link.hash,"")===location.href.replace(location.hash,""))return;if(link.href===location.href+"#")return;var defaults={url:link.href,container:$(link).attr("data-pjax"),target:link};var opts=$.extend({},defaults,options);var clickEvent=$.Event("pjax:click");$(link).trigger(clickEvent,[opts]);if(!clickEvent.isDefaultPrevented()){pjax(opts);event.preventDefault()}}function handleSubmit(event,container,options){options=optionsFor(container,options);var form=event.currentTarget;if(form.tagName.toUpperCase()!=="FORM")throw"$.pjax.submit requires a form element";var defaults={type:form.method.toUpperCase(),url:form.action,data:$(form).serializeArray(),container:$(form).attr("data-pjax"),target:form};pjax($.extend({},defaults,options));event.preventDefault()}function pjax(options){options=$.extend(true,{},$.ajaxSettings,pjax.defaults,options);if($.isFunction(options.url)){options.url=options.url()}var target=options.target;var hash=parseURL(options.url).hash;var context=options.context=findContainerFor(options.container);if(!options.data)options.data={};options.data._pjax=context.selector;function fire(type,args){var event=$.Event(type,{relatedTarget:target});context.trigger(event,args);return!event.isDefaultPrevented()}var timeoutTimer;options.beforeSend=function(xhr,settings){if(settings.type!=="GET"){settings.timeout=0}xhr.setRequestHeader("X-PJAX","true");xhr.setRequestHeader("X-PJAX-Container",context.selector);if(!fire("pjax:beforeSend",[xhr,settings]))return false;if(settings.timeout>0){timeoutTimer=setTimeout(function(){if(fire("pjax:timeout",[xhr,options]))xhr.abort("timeout")},settings.timeout);settings.timeout=0}options.requestUrl=parseURL(settings.url).href};options.complete=function(xhr,textStatus){if(timeoutTimer)clearTimeout(timeoutTimer);fire("pjax:complete",[xhr,textStatus,options]);fire("pjax:end",[xhr,options])};options.error=function(xhr,textStatus,errorThrown){var container=extractContainer("",xhr,options);var allowed=fire("pjax:error",[xhr,textStatus,errorThrown,options]);if(options.type=="GET"&&textStatus!=="abort"&&allowed){locationReplace(container.url)}};options.success=function(data,status,xhr){var currentVersion=typeof $.pjax.defaults.version==="function"?$.pjax.defaults.version():$.pjax.defaults.version;var latestVersion=xhr.getResponseHeader("X-PJAX-Version");var container=extractContainer(data,xhr,options);if(currentVersion&&latestVersion&&currentVersion!==latestVersion){locationReplace(container.url);return}if(!container.contents){locationReplace(container.url);return}pjax.state={id:options.id||uniqueId(),url:container.url,title:container.title,container:context.selector,fragment:options.fragment,timeout:options.timeout};if(options.push||options.replace){window.history.replaceState(pjax.state,container.title,container.url)}document.activeElement.blur();if(container.title)document.title=container.title;context.html(container.contents);var autofocusEl=context.find("input[autofocus], textarea[autofocus]").last()[0];if(autofocusEl&&document.activeElement!==autofocusEl){autofocusEl.focus()}executeScriptTags(container.scripts);if(typeof options.scrollTo==="number")$(window).scrollTop(options.scrollTo);if(hash!==""){var url=parseURL(container.url);url.hash=hash;pjax.state.url=url.href;window.history.replaceState(pjax.state,container.title,url.href);var target=$(url.hash);if(target.length)$(window).scrollTop(target.offset().top)}fire("pjax:success",[data,status,xhr,options])};if(!pjax.state){pjax.state={id:uniqueId(),url:window.location.href,title:document.title,container:context.selector,fragment:options.fragment,timeout:options.timeout};window.history.replaceState(pjax.state,document.title)}var xhr=pjax.xhr;if(xhr&&xhr.readyState<4){xhr.onreadystatechange=$.noop;xhr.abort()}pjax.options=options;var xhr=pjax.xhr=$.ajax(options);if(xhr.readyState>0){if(options.push&&!options.replace){cachePush(pjax.state.id,context.clone().contents());window.history.pushState(null,"",stripPjaxParam(options.requestUrl))}fire("pjax:start",[xhr,options]);fire("pjax:send",[xhr,options])}return pjax.xhr}function pjaxReload(container,options){var defaults={url:window.location.href,push:false,replace:true,scrollTo:false};return pjax($.extend(defaults,optionsFor(container,options)))}function locationReplace(url){window.history.replaceState(null,"","#");window.location.replace(url)}var initialPop=true;var initialURL=window.location.href;var initialState=window.history.state;if(initialState&&initialState.container){pjax.state=initialState}if("state"in window.history){initialPop=false}function onPjaxPopstate(event){var state=event.state;if(state&&state.container){if(initialPop&&initialURL==state.url)return;if(pjax.state.id===state.id)return;var container=$(state.container);if(container.length){var direction,contents=cacheMapping[state.id];if(pjax.state){direction=pjax.state.id<state.id?"forward":"back";cachePop(direction,pjax.state.id,container.clone().contents())}var popstateEvent=$.Event("pjax:popstate",{state:state,direction:direction});container.trigger(popstateEvent);var options={id:state.id,url:state.url,container:container,push:false,fragment:state.fragment,timeout:state.timeout,scrollTo:false};if(contents){container.trigger("pjax:start",[null,options]);if(state.title)document.title=state.title;container.html(contents);pjax.state=state;container.trigger("pjax:end",[null,options])}else{pjax(options)}container[0].offsetHeight}else{locationReplace(location.href)}}initialPop=false}function fallbackPjax(options){var url=$.isFunction(options.url)?options.url():options.url,method=options.type?options.type.toUpperCase():"GET";var form=$("<form>",{method:method==="GET"?"GET":"POST",action:url,style:"display:none"});if(method!=="GET"&&method!=="POST"){form.append($("<input>",{type:"hidden",name:"_method",value:method.toLowerCase()}))}var data=options.data;if(typeof data==="string"){$.each(data.split("&"),function(index,value){var pair=value.split("=");form.append($("<input>",{type:"hidden",name:pair[0],value:pair[1]}))})}else if(typeof data==="object"){for(key in data)form.append($("<input>",{type:"hidden",name:key,value:data[key]}))}$(document.body).append(form);form.submit()}function uniqueId(){return(new Date).getTime()}function stripPjaxParam(url){return url.replace(/\?_pjax=[^&]+&?/,"?").replace(/_pjax=[^&]+&?/,"").replace(/[\?&]$/,"")}function parseURL(url){var a=document.createElement("a");a.href=url;return a}function optionsFor(container,options){if(container&&options)options.container=container;else if($.isPlainObject(container))options=container;else options={container:container};if(options.container)options.container=findContainerFor(options.container);return options}function findContainerFor(container){container=$(container);if(!container.length){throw"no pjax container for "+container.selector}else if(container.selector!==""&&container.context===document){return container}else if(container.attr("id")){return $("#"+container.attr("id"))}else{throw"cant get selector for pjax container!"}}function findAll(elems,selector){return elems.filter(selector).add(elems.find(selector))}function parseHTML(html){return $.parseHTML(html,document,true)}function extractContainer(data,xhr,options){var obj={};obj.url=stripPjaxParam(xhr.getResponseHeader("X-PJAX-URL")||options.requestUrl);if(/<html/i.test(data)){var $head=$(parseHTML(data.match(/<head[^>]*>([\s\S.]*)<\/head>/i)[0]));var $body=$(parseHTML(data.match(/<body[^>]*>([\s\S.]*)<\/body>/i)[0]))}else{var $head=$body=$(parseHTML(data))}if($body.length===0)return obj;obj.title=findAll($head,"title").last().text();if(options.fragment){if(options.fragment==="body"){var $fragment=$body}else{var $fragment=findAll($body,options.fragment).first()}if($fragment.length){obj.contents=$fragment.contents();if(!obj.title)obj.title=$fragment.attr("title")||$fragment.data("title")}}else if(!/<html/i.test(data)){obj.contents=$body}if(obj.contents){obj.contents=obj.contents.not(function(){return $(this).is("title")});obj.contents.find("title").remove();obj.scripts=findAll(obj.contents,"script[src]").remove();obj.contents=obj.contents.not(obj.scripts)}if(obj.title)obj.title=$.trim(obj.title);return obj}function executeScriptTags(scripts){if(!scripts)return;var existingScripts=$("script[src]");scripts.each(function(){var src=this.src;var matchedScripts=existingScripts.filter(function(){return this.src===src});if(matchedScripts.length)return;var script=document.createElement("script");script.type=$(this).attr("type");script.src=$(this).attr("src");document.head.appendChild(script)})}var cacheMapping={};var cacheForwardStack=[];var cacheBackStack=[];function cachePush(id,value){cacheMapping[id]=value;cacheBackStack.push(id);while(cacheForwardStack.length)delete cacheMapping[cacheForwardStack.shift()];while(cacheBackStack.length>pjax.defaults.maxCacheLength)delete cacheMapping[cacheBackStack.shift()]}function cachePop(direction,id,value){var pushStack,popStack;cacheMapping[id]=value;if(direction==="forward"){pushStack=cacheBackStack;popStack=cacheForwardStack}else{pushStack=cacheForwardStack;popStack=cacheBackStack}pushStack.push(id);if(id=popStack.pop())delete cacheMapping[id]}function findVersion(){return $("meta").filter(function(){var name=$(this).attr("http-equiv");return name&&name.toUpperCase()==="X-PJAX-VERSION"}).attr("content")}function enable(){$.fn.pjax=fnPjax;$.pjax=pjax;$.pjax.enable=$.noop;$.pjax.disable=disable;$.pjax.click=handleClick;$.pjax.submit=handleSubmit;$.pjax.reload=pjaxReload;$.pjax.defaults={timeout:650,push:true,replace:false,type:"GET",dataType:"html",scrollTo:0,maxCacheLength:20,version:findVersion};$(window).on("popstate.pjax",onPjaxPopstate)}function disable(){$.fn.pjax=function(){return this};$.pjax=fallbackPjax;$.pjax.enable=enable;$.pjax.disable=$.noop;$.pjax.click=$.noop;$.pjax.submit=$.noop;$.pjax.reload=function(){window.location.reload()};$(window).off("popstate.pjax",onPjaxPopstate)}if($.inArray("state",$.event.props)<0)$.event.props.push("state");$.support.pjax=window.history&&window.history.pushState&&window.history.replaceState&&!navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]|WebApps\/.+CFNetwork)/);$.support.pjax?enable():disable()})(jQuery);

$(document).pjax("a", ".wrapper", {fragment: ".wrapper"})

$(document).on("click", "a[id]", function (e) {
  _gaq.push ["_trackEvent", "Clicks", "clicked on " + e.target.id]
})

$(document).on("click", "a:not([id])", function (e) {
  _gaq.push ["_trackEvent", "Clicks", "clicked on " + $(this).text()]
})

$(document).on("ready pjax:end", function () {
  var heads = ["👋", "🍉", "🐝", "💥", "🌵", "🎈", "🐧", "👓", "💎", "🐞", "🐬", "🐈", "🌳", "👻", "🍟", "🍅", "🍐", "⚓", "️🏡", "🚷"]
  $(".js-head").text(heads[Math.floor(Math.random() * heads.length)])
  $(".wrapper").toggleClass("post-layout", Boolean($("article").length))
})
