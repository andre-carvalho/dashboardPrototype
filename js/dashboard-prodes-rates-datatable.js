var utils = {
	config:{},
	printWindow:null,
	statusPrint:false,
	setConfig: function(config) {
		utils.config=config;
	},
	onResize:function(event) {
		clearTimeout(utils.config.resizeTimeout);
		utils.config.resizeTimeout = setTimeout(utils.rebuildAll, 200);
	},
	updateDimensions: function() {
		var d={ w: window.innerWidth,
				h: window.innerHeight};
		graph.setDimensions(d);
	},
	rebuildAll: function() {
		utils.updateDimensions();
		graph.build();
	}
};

var graph={

	barRateByYear: null,
	lineRateStatesByYear: null,
	pieTotalizedByState: null,
	dataTable: null,

	yearDimension: null,
	ufDimension: null,
	ufYearDimension: null,
	stateYearDimension: null,

	yearRateGroup: null,
	ufRateGroup: null,
	stateYearRateGroup: null,

	data:null,
	data_all:null,

	winWidth: window.innerWidth,
	winHeight: window.innerHeight,

	pallet: ["#FF0000","#FF6A00","#FF8C00","#FFA500","#FFD700","#FFFF00","#DA70D6","#BA55D3","#7B68EE"],

	setDimensions: function(dim) {
		this.winWidth=dim.w;
		this.winHeight=dim.h;
	},
	setChartReferencies: function() {

		this.barRateByYear = dc.barChart("#chart-by-year");
		this.lineRateStatesByYear = dc.seriesChart("#chart-by-year-state");
		this.pieTotalizedByState = dc.pieChart("#chart-by-state");
		this.dataTable = dataTable("data-table");
	},
	loadData: function() {
		// baixar os dados do PRODES!!
		// http://terrabrasilis.info/fip-service/fip-project-prodes/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=fip-project-prodes:prodes_rates_d&outputFormat=csv
		d3.csv("data/prodes_rates_d.csv", graph.processData);
		// http://terrabrasilis.info/prodes-data/PRODES/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=PRODES:prodes_rates_d&outputFormat=application%2Fjson
		//d3.json("data/prodes_rates.json", graph.processData);
	},
	processData: function(error, data) {
		if (error) throw error;

		var o=[],t=[];
		for (var j = 0, n = data.length; j < n; ++j) {
			var obj={
				uf:data[j].state,
				year:data[j].year,
				rate:+data[j].rate,
				ufYear:data[j].state + "/" + data[j].year
			};
			if(data[j].state=='AMZ') {
				t.push(obj);
			}else{
				o.push(obj);
			}
		}
		data = o;
		graph.data_all = t;
		graph.registerDataOnCrossfilter(data);
		graph.build();
	},
	registerDataOnCrossfilter: function(data) {
		graph.data=data;
		var ndx = crossfilter(data);

		this.yearDimension = ndx.dimension(function(d) {
			return d.year;
		});
		this.ufDimension = ndx.dimension(function(d) {
			return d.uf;
		});
		this.ufYearDimension = ndx.dimension(function(d) {
			return d.ufYear;
		});
		this.stateYearDimension = ndx.dimension(function(d) {
			return [d.uf, +d.year];
		});

		this.yearRateGroup = this.yearDimension.group().reduceSum(function(d) {
			return +d.rate;
		});
		this.ufRateGroup = this.ufDimension.group().reduceSum(function(d) {
			return +d.rate;
		});
		this.stateYearRateGroup = this.stateYearDimension.group().reduceSum(function(d) {
			return +d.rate;
		});
	},
	buildDataTable: function() {
		var data2Table=[], yearFilter=[];
		graph.ufYearDimension.bottom(Infinity).forEach(
			function (y) {
				data2Table.push({
					uf:y.uf,
					year:y.year,
					rate:y.rate
				});
				if(yearFilter.indexOf(y.year) < 0) {
					yearFilter.push(y.year);
				}
			}
		);
		graph.data_all.forEach(function(da){
			if(yearFilter.indexOf(da.year) >= 0) {
				data2Table.push({
					uf:da.uf,
					year:da.year,
					rate:da.rate
				});
			}
		});
		graph.dataTable.init(data2Table);
		graph.dataTable.redraw();
	},
	build: function() {
		var w=parseInt(this.winWidth - (this.winWidth * 0.05)),
		h=parseInt(this.winHeight * 0.3);

		this.setChartReferencies();

		var fw=parseInt(w),
		fh=parseInt((this.winHeight - h) * 0.6);

		var years=graph.yearDimension.group().all();

		this.barRateByYear
			.height(fh)
			.width(parseInt( (fw/4) * 3))
			.margins({top: 0, right: 10, bottom: 45, left: 45})
			.yAxisLabel("Desmatamento (km²/ano)")
			.xAxisLabel("Período de monitoramento da Amazônia Legal: " + years[0].key + " - " + years[years.length-1].key)
			.dimension(this.yearDimension)
			.group(this.yearRateGroup)
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(1))) + " km²";
			})
			.label(function(d) {
				var t=Math.abs((d.data.value/1000).toFixed(1));
				t=(t<1?parseInt(d.data.value):t+"k");
				return t;
			})
			.elasticY(true)
			.clipPadding(10)
			.yAxisPadding('10%')
			.x(d3.scale.ordinal())
	        .xUnits(dc.units.ordinal)
	        .barPadding(0.3)
			.outerPadding(0.1)
			.renderHorizontalGridLines(true)
			.ordinalColors(["gold"]);

		this.barRateByYear
			.on("renderlet.a",function (chart) {
				// rotate x-axis labels
				chart.selectAll('g.x text')
					.attr('transform', 'translate(-15,7) rotate(315)');
			});


		this.lineRateStatesByYear
			.width(fw)
			.height(fh)
			.margins({top: 0, right: 10, bottom: 45, left: 45})
			.chart(function(c) { return dc.lineChart(c).interpolate('cardinal'); })
			.x(d3.scale.ordinal())
	        .xUnits(dc.units.ordinal)
			.brushOn(true)
			.yAxisLabel("Desmatamento (km²/ano)")
			.xAxisLabel("Período de monitoramento da Amazônia Legal: " + years[0].key + " - " + years[years.length-1].key)
			.renderHorizontalGridLines(true)
			.renderVerticalGridLines(true)
			.title(function(d) {
				return "Área/"+d.key[1]+": " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.elasticY(true)
			.yAxisPadding('10%')
			.dimension(this.stateYearDimension)
			.group(this.stateYearRateGroup)
			.mouseZoomable(false)
			.seriesAccessor(function(d) {
				return d.key[0];
			})
			.keyAccessor(function(d) {
				return +d.key[1];
			})
			.valueAccessor(function(d) {
				return +d.value;
			})
			.ordinalColors(graph.pallet)
			.seriesSort(function(a,b) {
				var rank=graph.ufRateGroup.top(Infinity);
				var sr=[];
				rank.forEach(function(d){
					sr[d.key]=+d.value;
				});
				return d3.descending(sr[a], sr[b]);
			})
			.legend(dc.legend().x(fw - graph.lineRateStatesByYear.margins().right - 40).y(5).itemHeight(13).gap(7).horizontal(0).legendWidth(50).itemWidth(40));

		this.lineRateStatesByYear
			.on("renderlet.a",function (chart) {
				// rotate x-axis labels
				chart.selectAll('g.x text')
					.attr('transform', 'translate(-15,7) rotate(315)');
			});

		this.pieTotalizedByState
			.height(fh)
			.width(parseInt(fw/4))
			.innerRadius(10)
			.externalRadiusPadding(30)
			.dimension(this.ufDimension)
			.group(this.ufRateGroup)
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.label(function(d) {
				return d.key + ":" + parseInt(Math.round(+d.value));
			})
			.ordinalColors(graph.pallet)
			.legend(dc.legend().x(1).y(5).itemHeight(13).gap(7).horizontal(0).legendWidth(50).itemWidth(40));
		
		this.pieTotalizedByState.on("postRedraw", this.buildDataTable);
			
		dc.renderAll();
		this.buildDataTable();
	},
	init: function() {
		window.onresize=utils.onResize;
		this.loadData();
	},
	/*
	 * Called from the UI controls to clear one specific filter.
	 */
	resetFilter: function(who) {
		if(who=='year'){
			graph.barRateByYear.filterAll();
		}else if(who=='state'){
			graph.pieTotalizedByState.filterAll();
		}
		dc.redrawAll();
	}
};

graph.init();
