var makeAnnualGraphs=function() {
	
	makeGraphs('year');
};

var makeMonthlyGraphs=function() {
	
	makeGraphs('month');
};

var makeGraphs=function(id) {
	
	d3.json("./data/deter_"+id+"_dashboard.json", function(error, data) {
		if (error) throw error;
		var o={},dt=[], st=[];
		for (var j = 0, n = data.totalFeatures; j < n; ++j) {
			var fet=data.features[j];
			if(!o[fet.properties.uf]) {
				o[fet.properties.uf]=[];
				st.push(fet.properties.uf);
			}
			if(!dt[fet.properties.uf]) {
				dt[fet.properties.uf]=[];
			}
			if(dt[fet.properties.uf].indexOf(fet.properties.dt)<0) {
				dt[fet.properties.uf].push(fet.properties.dt);
				o[fet.properties.uf].push({date:fet.properties.dt});
			}else {
				o[fet.properties.uf][dt[fet.properties.uf].indexOf(fet.properties.dt)][fet.properties.cl] = +fet.properties.ar;
			}
			if(!o[fet.properties.uf]['columns']) {
				o[fet.properties.uf]['columns']=[];
				o[fet.properties.uf]['columns'].push('date');
			}
			if(o[fet.properties.uf]['columns'].indexOf(fet.properties.cl)<0) {
				o[fet.properties.uf]['columns'].push(fet.properties.cl);
			}
		}
		data = o;
		var len=st.length;
		var svgs=createSVGToCharts(len, 3, id);
		
		for (var i = 0; i < len; ++i) {
			d = data[st[i]];
			d.title = "Distribuição de área "+( (id=='year')?("anual"):("mensal") )+": " + st[i]+" ";
			makeGraph(d, svgs.svgs[i], svgs.dims[i]);
		}
	});
};

/**
 * Prepare configuration to make a graphs.
 * @return dimansions, {}, One object with client dimensions obtained from navigator.
 */
var getDimensions=function() {

    var margin = {top: 20, right: 20, bottom: 30, left: 30},
    width = window.innerWidth - margin.left - margin.right - 200,
    height = window.innerHeight - margin.top - margin.bottom - 100;
    
	return {
		w_browser: window.innerWidth,
		h_browser: window.innerHeight,
		width: width,
		height: height,
		margin: margin
	};
};

var makeGraph=function(data, g, dim) {

	var x0 = d3.scaleBand()
    .rangeRound([0, dim.width])
    .paddingInner(0.1);

	var x1 = d3.scaleBand()
	    .padding(0.05);
	
	var y = d3.scaleLinear()
	    .rangeRound([dim.height, 0]);
	
	var z = d3.scaleOrdinal()
	    .range(["#ff0000", "#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	
	//set the ranges
	var x = d3.scaleTime().range([0, dim.width]);
	//var y = d3.scaleLinear().range([height, 0]);
	
	//gridlines in x axis function
	var make_x_gridlines=function() {
	    return d3.axisBottom(x)
	        .ticks(5)
	};
	// gridlines in y axis function
	var make_y_gridlines=function() {
	    return d3.axisLeft(y)
	        .ticks(5)
	};

	var keys = data.columns.slice(1);
	
	x0.domain(data.map(function(d) {
		return d.date;
	}));
	
	x1.domain(keys).rangeRound([0, x0.bandwidth()]);
	
	y.domain([0, d3.max(data, function(d) {
		return d3.max(keys, function(key) {
			return ( (d[key])?(d[key]):(0) );
		}); 
	})]).nice();
	
	g.append("g")
	.selectAll("g")
	.data(data)
	.enter().append("g")
	.attr("transform", function(d) { return "translate(" + x0(d.date) + ",0)"; })
	.selectAll("rect")
	.data(function(d) {
		return keys.map(function(key) {
			return {key: key, value: ( (d[key])?(d[key]):(0) )};
		});
	})
	.enter().append("rect")
	.attr("x", function(d) { return x1(d.key); })
	.attr("y", function(d) { return y(d.value); })
	.attr("width", x1.bandwidth())
	.attr("height", function(d) { return dim.height - y(d.value); })
	.attr("fill", function(d) { return z(d.key); });
	
	//add the X gridlines
	g.append("g")
	.attr("class", "grid")
	.attr("transform", "translate(0," + dim.height + ")")
	.call(make_x_gridlines()
	.tickSize(-dim.height)
	.tickFormat("")
	);
	
	// add the Y gridlines
	g.append("g")
	.attr("class", "grid")
	.call(make_y_gridlines()
	.tickSize(-dim.width)
	.tickFormat("")
	);
	
	g.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0," + dim.height + ")")
	.call(d3.axisBottom(x0));
	
	g.append("g")
	.attr("class", "axis")
	.call(d3.axisLeft(y).ticks(null, "s"))
	.append("text")
	.attr("x", 2)
	.attr("y", y(y.ticks().pop()) + 0.5)
	.attr("dy", "0.32em")
	.attr("fill", "#000")
	.attr("font-weight", "bold")
	.attr("text-anchor", "start")
	.text(data.title+" (Km²)");
	
	var legend = g.append("g")
	.attr("font-family", "sans-serif")
	.attr("font-size", 10)
	.attr("text-anchor", "end")
	.selectAll("g")
	.data(keys.slice().reverse())
	.enter().append("g")
	.attr("transform", function(d, i) {
	return "translate(0," + i * 20 + ")";
	});
	
	legend.append("rect")
	.attr("x", dim.width - 19)
	.attr("width", 19)
	.attr("height", 19)
	.attr("fill", z);
	
	legend.append("text")
	.attr("x", dim.width - 24)
	.attr("y", 9.5)
	.attr("dy", "0.32em")
	.text(function(d) {
		return d;
	});
};

/**
 * Make grid and create SVG elements inside HTML document.
 * @param chartsLength, The number of charts that we need.
 * @param perLine, The number of charts per line. Need be 12's multiple.
 */
var createSVGToCharts = function(chartsLength, perLine, id) {
	
	var dimensions=getDimensions();
	var chartsArea = document.getElementById("chartsArea");
	id = ( (id===undefined)?('col'):(id) );
	if(perLine>12) {
		throw {name:'Max value exceeded.', message:'The perLine parameter cannot be more than 12.'};
	}
	if(12%perLine) {
		throw {name:'Need be 12\'s multiple.', message:'The perLine should multiple of 12.'};
	}
	var l=12, ld=l/perLine;
	var t=chartsLength/perLine;//Math.ceil(chartsLength/perLine);
	var svgs = [], dims = [];
	for (var i=0; i<t; ++i) {
	
		var row = document.createElement("div");
		row.setAttribute('class', 'row');
		
		for (var j=0; j<perLine; ++j) {
			var col = document.createElement("div");
			col.setAttribute('class', 'col-md-'+ld);
			col.setAttribute('id', id+'_'+i+'_'+j);
		    row.appendChild(col);
		    chartsArea.appendChild(row);

		    var svg = d3.select('#'+id+'_'+i+'_'+j).append("svg");
		    dims.push({width:parseInt(dimensions.width/perLine),height:parseInt(dimensions.height/perLine)});
			svg.attr("width", parseInt(dimensions.w_browser/perLine));
		    svg.attr("height", parseInt(dimensions.h_browser/perLine));
		    svg = ( svg.append("g").attr("transform", "translate(" + dimensions.margin.left + "," + dimensions.margin.top + ")") );
		    svgs.push(svg);
		}
	}
	return {svgs:svgs, dims:dims};
};