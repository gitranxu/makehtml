$().ready(function(){
	the_event();
});

function the_event(){
	$('#atoms').on('click','.atom',function(e){
		$(this).addClass('active').siblings().removeClass('active');
		//将该元素对应的model找出来，然后将其配置信息在配置面板进行显示
		var mid = $(this).attr('mid');
		if(mid&&$('#ele_config').attr('mid')==mid){
			return;
		}
		var model_obj = mid ? getModelById(mid) : null;
		model_obj ? parseModelToConfig(model_obj) : resetConfig();
	});

	drag_event();
	nav_event();//左侧导航相关事件
	ele_config_event();//右侧配置相关事件
}

function ele_config_event(){

	$('#input_classes').on('blur',function(){
		var val = $(this).val().trim();
		var val_arr = val.split(' ');
		var html = '';
		for(var i = 0,j = val_arr.length;i < j;i++){
			if(!isClassNameExist(val_arr[i])&&val_arr[i]){
				html += '<li><span class="name">'+val_arr[i]+'</span><span class="btn del" title="删除">D</span><span class="btn namespace" title="类名空间">M</span></li>';
			}
			
		}
		$('#classes').append(html);
	});

	//点击配置删除按钮时
	$('#classes').on('click','.del',function(){
		$(this).parent().remove();
	});

	$('#classes').on('click','.btn.namespace',function(){
		$('#classes .name.namespace').removeClass('namespace');
		$(this).parent().find('.name').addClass('namespace');
		//$(this).parent().siblings().find('.name').removeClass('main');
		
	});
}

function isClassNameExist(className){
	var result = false;
	$('#classes .name').each(function(){
		if($(this).text()==className){
			result = true;
			return false;
		}
	});
	return result;
}

function nav_event(){
	//点击
	$('#nav').on('click','.text',function(e){
		$('#nav .text').removeClass('active');
		$(this).addClass('active');
	});

	$('#nav').on('click','.text .del',function(){
		//1.根据_ele找到页面中对应的元素，删除掉
		//2.根据_namespace在nav中进行查找，如果还有这个命名空间的值，则不进行操作，否则删除掉style_obj中对应的值
		//3.如果操作了style_obj对象，则需要执行reDrawStyle方法
		var $text = $(this).parent();
		var _ele = $text.attr('_ele');
		var _namespace = $text.attr('_namespace');
		$(this).parents('.nav_item').eq(0).remove(); //删除自己
		$('[ele="'+_ele+'"]').remove();//删除页面对应元素
		delStyle(_namespace);

	});
}

function drag_event(){
	$('.atom').draggable({
		helper:function(){
			if(!$(this).hasClass('active')){
				alert('请先选择要拖拽的元素~');
				return '<div></div>';
			}
			return $(this).clone();
		},
		stop:function(){
			//拖拽结束的时候，根据选择的目标元素以及拖拽元素的配置将元素append到文档中
			//alert('拖拽结束'+$(this).text());
			//1.得到mid
			//2.根据mid得到model_obj
			
			//5.根据选择的nav，在其中将第4步组装好的html加入其中
			//6.修改nav，将新加入的对应的nav元素放入nav中
			//3,4步需要在6完成后才能进行，不然对于嵌套的元素无法取到类名的命名空间
			//3.得到当前配置模板的css
			//4.得到model_obj中的html并根据第3步给其加上合适的类名
			var mid = $(this).attr('mid');
			var model_obj = mid ? getModelById(mid) : null;
			if(!model_obj){
				alert('要么没配置mid，要么根据该mid并没有找到对应的model_obj信息.');
				return;
			}
			
			var $html = generateHTML(model_obj);//根据配置信息，将类名加入到model_obj的html中去
			var now = new Date();
			var uuid = 's'+Math.random()+now.getMonth()+now.getDate()+now.getHours()+now.getMinutes()+now.getSeconds();
			$html.attr('ele',uuid);

			var $cntr = getCntrByNav();
			$cntr.append($html.get(0));

			saveConfigCss($html,uuid);//根据配置信息，将CSS信息保存到style中去，需去重

		}
	});
}

var reg_danwei = /(px|em|rem|%)$/;
//根据配置信息，将CSS信息保存到style中去，需去重
function saveConfigCss($html,uuid){
	//.test1 .test2 .c{width:10px;}
	//得到类名的时候，最多向外取三层，取每层的类名空间
	var namespace_css_s = getNameSpace($html);

	addNav($html,uuid,namespace_css_s);

	if(!namespace_css_s){//如果为空，则不用继续处理
		return;
	}
	var opt_css = '';
	opt_css += getOptionCSS('width',$('#input_width'));
	opt_css += getOptionCSS('height',$('#input_height'));
	opt_css += getOptionCSS('background',$('#input_background'),true);
	opt_css += getOptionCSS('color',$('#input_color'),true);
	opt_css += getOptionCSS('font-size',$('#input_fontSize'));
	opt_css += getOptionCSS('text-align',$('#input_textAlign'),true);
	opt_css += getOptionCSS('line-height',$('#input_lineHeight'));
	opt_css += getOptionCSS('margin',$('#input_margin'),true);
	opt_css += getOptionCSS('margin-left',$('#input_marginLeft'));
	opt_css += getOptionCSS('margin-right',$('#input_marginRight'));
	opt_css += getOptionCSS('margin-top',$('#input_marginTop'));
	opt_css += getOptionCSS('margin-bottom',$('#input_marginBottom'));
	opt_css += getOptionCSS('padding',$('#input_padding'),true);
	opt_css += getOptionCSS('padding-left',$('#input_paddingLeft'));
	opt_css += getOptionCSS('padding-right',$('#input_paddingRight'));
	opt_css += getOptionCSS('padding-top',$('#input_paddingTop'));
	opt_css += getOptionCSS('padding-bottom',$('#input_paddingBottom'));

	var css_s =  namespace_css_s+'{'+opt_css+'}';
	/*var style_s = $('style').eq(0).text();
	if(style_s.indexOf(css_s)==-1){
		$('style').eq(0).text(style_s+css_s);
	}*/
	saveStyle(namespace_css_s,css_s);

	

	reDrawStyle();
}

function saveStyle(key,val){
	style_obj[key] = val;
}

function delStyle(key){
	//删除的时候要查询同一个样式，是否还有其他元素使用，如果还有，则不删除，如果已没有元素在使用了，则删除
	var $hasOther = $('#nav').find('[_namespace="'+key+'"]');
	if(!$hasOther.length){//如果没有，则删除掉对应的CSS
		delete style_obj[key];
		reDrawStyle();
	}
}

function reDrawStyle(){
	var $style = $('style').eq(0);
	var css_s = '';
	for(var key in style_obj){
		css_s += style_obj[key];
	}
	$style.empty().text(css_s);
}

function addNav($html,uuid,namespace){
	if(!namespace){
		namespace = '';
	}
	var name = $html.attr('namespace_css');
	if(!name){
		if($html.attr('class')){
			name = $html.attr('class').split(' ')[0];
		}else{
			name = '无';
		}
	}
	var html = '<div class="nav_item"><div class="text" _ele="'+uuid+'" _namespace="'+namespace+'"><span>'+name+'</span><span class="btn del">del</span></div></div>';
	$('#nav .text.active').parent().append(html);
}

//得到某个属性的css字符串  not_auto_add_danwei:不自动加上默认px单位
function getOptionCSS(name,$val,not_auto_add_danwei){
	var val = $val.val();
	if(!not_auto_add_danwei && !reg_danwei.test(val)){ //如果没有单位，则加上单位
		val+='px';
	}
	var isUse = $val.parents('.prop_title:eq(0)').find('.default input').prop('checked');
	if(isUse){
		return name+':'+val+';'
	}else{
		return '';
	}
	
}

function getNameSpace($html){
	var count = 0;
	var s = [];
	var empty = false;//是否没有类名，如果没有类名，则返回空，这时候不需要读取配置信息
	getS($html);
	function getS($html){
		var namespace_css = '';
		if(count==0){//如果是它本身，如果没有namespace,则取其第一个类名作为样式名(如果要用配置模板，则肯定要有类名)
			namespace_css = $html.attr('namespace_css');
			//namespace_css = namespace_css || $html.attr('class').split(' ')[0];
			if(!namespace_css){
				if($html.attr('class')){
					namespace_css = $html.attr('class').split(' ')[0];
				}else{//这种情况下说明没有类名
					empty = true;
					return;
				}
			}
		}
		s.push(namespace_css);
		count++;
		if(count >= 3){//最多取三层
			return;
		}
		var $parent = $html.parents('[namespace_css]').eq(0);
		if($parent.length){
			getS($parent);
		}
	}
	if(empty){
		return '';
	}
	return '.'+s.reverse().join(' .');
}

//根据nav找到页面元素
function getCntrByNav(){
	//1.找到nav中active所在元素的_ele属性中的值
	//2.根据1得到的值，查找文档中ele属性值与其一值的元素即为要查找的元素
	var ele_val = $('#nav .text.active').attr('_ele');
	if(!ele_val){
		alert('nav中的元素没有设置_ele值')
	}
	return $('[ele="'+ele_val+'"]');
}

/*opt_default:{
			href:'http://www.sohu.com',
			target:'_blank',
			text:'GOGOGO'
		}*/
//根据配置信息，将类名加入到model_obj的html中去
function generateHTML(model_obj){
	var html = model_obj.html;
	var $html = $('#forHTMLParse').empty().append($(html)).children();
	$('#classes .name').each(function(){
		var name = $(this).text();
		$html.addClass(name);
		if($(this).hasClass('namespace')){
			$html.attr('namespace_css',name);
		}
	});

	$('#prop_zone .prop_item.has').each(function(){
		var _name = $(this).attr('_name');
		var isUse = $(this).find('.default input').prop('checked');
		if(isUse){
			if(_name!='text'){
				$html.attr(_name,$(this).find('.input input').val());
			}else{
				$html.text($(this).find('.input input').val());
			}
		}
	});

	return $html;
}

function parseModelToConfig(model_obj){
	
	$('#ele_config').attr('mid',model_obj.id);

	var cs_def = model_obj.css_default;
	//解析classes
	var classes = cs_def.classes;
	var classes_arr = classes.length && classes.split(' ');
	if(classes_arr){
		var $classes = $('#classes');
		$classes.empty();
		for(var i = 0,j = classes_arr.length;i < j;i++){
			var class_name = classes_arr[i];
			var class_main = '';
			if(class_name.indexOf(':namespace')!=-1){
				class_name = class_name.replace(':namespace','');
				class_main = 'namespace';
			}
			var html = '<li><span class="name '+class_main+'">'+class_name+'</span><span class="btn del" title="删除">D</span><span class="btn namespace" title="类名空间">M</span></li>';
			$classes.append(html);
		}
	} 

	var width = cs_def.width;
	width && $('#input_width').val(width);

	var height = cs_def.height;
	height && $('#input_height').val(height);

	var margin = cs_def.margin;
	margin && $('#input_margin').val(margin);

	var marginLeft = cs_def.marginLeft;
	marginLeft && $('#input_marginLeft').val(marginLeft);

	//解析prop
	var props = model_obj.opt_default;
	$('#prop_zone').removeClass('has');
	$('#prop_zone .prop_item').removeClass('has');
	for(var key in props){
		var $prop_item = $('#prop_zone .prop_item[_name="'+key+'"]');
		$prop_item.addClass('has');
		$prop_item.find('.input input').val(props[key]);
		$('#prop_zone').addClass('has');
	}

}

//重置配置信息
function resetConfig(){
	$('#ele_config').attr('mid','');
	$('#classes').empty();
	$('#ele_config input[type="text"]').val('');
	$('#ele_config input[type="color"]').val('#000000');
	$('#prop_zone .prop_item').removeClass('has');
	$('#prop_zone').removeClass('has');
}

function getModelById(mid){
	for(var i = 0,j = model_arr.length;i < j;i++){
		if(model_arr[i].id == mid){
			return model_arr[i];
		}
	}
}

//样式对象，用于存储样式，键为命名空间，值为样式值(暂时只考虑如果命名空间重复，则后写的会把前一次的给覆盖掉，不保留前一次的值)
var style_obj = {};

var model_arr = [{
		id:'001',
		name :'模板div',
		html:'<div></div>',
		css:'',
		//css:'.test{background:red;}',
		css_default:{
			width:180,
			height:40,
			fontSize:30,
			fontColor:'yellow',
			margin:'0 auto',
			marginLeft:'30px',
			classes:'t a:namespace b'
		}
	},{
		id:'002',
		name :'模板a',
		html:'<a></a>',
		css:'',
		//css:'.test{background:red;}',
		css_default:{
			width:180,
			height:140,
			fontSize:30,
			fontColor:'yellow',
			margin:'10px auto',
			marginLeft:'60px',
			classes:'t a:namespace b'
		},
		opt_default:{
			href:'http://www.sohu.com',
			target:'_blank',
			text:'GOGOGO'
		}
	},{
		id:'004',
		name :'模板img',
		html:'<img></img>',
		css:'',
		//css:'.test{background:red;}',
		css_default:{
			width:180,
			height:140,
			fontSize:30,
			fontColor:'yellow',
			margin:'10px auto',
			marginLeft:'60px',
			classes:'t a:namespace b'
		},
		opt_default:{
			src:'http://imgsrc.baidu.com/forum/w=580/sign=839627fc2d381f309e198da199034c67/c2290a55b319ebc4aafc635d8726cffc1f171601.jpg'
		}
	}];