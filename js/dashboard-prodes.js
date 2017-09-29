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
		var d={w: window.innerWidth,
				h: window.innerHeight};
		graph.setDimensions(d);
	},
	rebuildAll: function() {
		utils.updateDimensions();
		graph.build();
	},
	/*
	 * Remove numeric values less than 1e-6
	 */
	snapToZero:function(sourceGroup) {
		return {
			all:function () {
				return sourceGroup.all().map(function(d) {
					return {key:d.key,value:( (Math.abs(d.value)<1e-6) ? 0 : d.value )};
				});
			},
			top: function(n) {
				return sourceGroup.top(Infinity)
					.filter(function(d){
						return (Math.abs(d.value)>1e-6);
						})
					.slice(0, n);
			}
		};
	}
};

var graph={

	barAreaByYear: null,
	pieTotalizedByState: null,
	rowTop10ByMun: null,
	rowTop10ByUc: null,

	yearDimension: null,
	ufDimension: null,
	munDimension: null,
	ucDimension: null,
	yearAreaMunGroup: null,
	ufAreaMunGroup: null,
	ucAreaUcGroup: null,
	munAreaMunGroup: null,
	
	data:null,
	
	winWidth: window.innerWidth,
	winHeight: window.innerHeight,
	
	pallet: ["#ff5500","#FFFF00","#FF00FF","#F8B700","#78CC00","#00FFFF","#56B2EA","#007eff","#00FF00","#ceff00"],
	
	setDimensions: function(dim) {
		this.winWidth=dim.w;
		this.winHeight=dim.h;
	},
	setChartReferencies: function() {
		
		this.barAreaByYear = dc.barChart("#chart-by-year");
		this.pieTotalizedByState = dc.pieChart("#chart-by-state");
		this.rowTop10ByMun = dc.rowChart("#chart-by-mun");
		this.rowTop10ByUc = dc.rowChart("#chart-by-uc");
	},
	getOrdinalColorsToYears: function(itens) {
		var c=[];
		var ys=graph.yearDimension.group().all();
		var cor=graph.pallet;
		for(var i=0;i<ys.length;i++) {
			c.push({key:ys[i].key,color:cor[i]});
		}
		return c;
	},
	loadData: function() {
		// baixar os dados do PRODES!!
		// http://terrabrasilis.info/prodes-data/PRODES/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=PRODES:prodes_d&outputFormat=application%2Fjson
		d3.json("data/prodes.json", graph.processData);
	},
	processData: function(error, data) {
		if (error) throw error;
		
		var o=[];
		for (var j = 0, n = data.totalFeatures; j < n; ++j) {
			var fet=data.features[j];
			o.push({
				year:+fet.properties.g,
				aTotal:+fet.properties.d,
				aMun:+fet.properties.e,
				aUc:+fet.properties.f,
				uf:fet.properties.h,
				mun:fet.properties.i,
				uc:fet.properties.j,
				cl:fet.properties.c
			});
		}
		data = o;
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
		this.munDimension = ndx.dimension(function(d) {
			return d.mun;
		});
		this.ucDimension = ndx.dimension(function(d) {
			return ((d.uc)?(d.uc):('null'));
		});
		
		this.yearAreaMunGroup = this.yearDimension.group().reduceSum(function(d) {
			return +d.aMun;
		});
		this.ufAreaMunGroup = this.ufDimension.group().reduceSum(function(d) {
			return +d.aMun;
		});
		this.ucAreaUcGroup = this.ucDimension.group().reduceSum(function(d) {
			return +d.aUc;
		});
		this.munAreaMunGroup = this.munDimension.group().reduceSum(function(d) {
			return +d.aMun;
		});
		
	},
	build: function() {
		var w=parseInt(this.winWidth - (this.winWidth * 0.05)),
		h=parseInt(this.winHeight * 0.3),
		barColors = this.getOrdinalColorsToYears();
		
		this.setChartReferencies();
		
		var minWidth=250, maxWidth=600, fw=parseInt((w)/2),
		fh=parseInt((this.winHeight - h) * 0.6);
		// define min width to filter graphs
		fw=((fw<minWidth)?(minWidth):(fw));
		// define max width to filter graphs
		fw=((fw>maxWidth)?(maxWidth):(fw));

		this.barAreaByYear
			.height(fh)
			.width(fw)
			.yAxisLabel("Área (km²)")
			.xAxisLabel("Ano")
			.dimension(this.yearDimension)
			.group(utils.snapToZero(this.yearAreaMunGroup))
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.label(function(d) {
				return parseInt(Math.round(+d.data.value));
			})
			.elasticY(true)
			.yAxisPadding('10%')
			.x(d3.scale.ordinal())
	        .xUnits(dc.units.ordinal)
	        .barPadding(0.2)
			.outerPadding(0.1)
			.renderHorizontalGridLines(true)
			.colorAccessor(function(d) {
				var i=0,l=barColors.length;
				while(i<l){
					if(barColors[i].key==d.key){
						return barColors[i].color;
					}
					i++;
				}
			});

		this.barAreaByYear.margins().left += 30;
	
		this.pieTotalizedByState
			.height(fh)
			.width(fw)
			.innerRadius(10)
			.externalRadiusPadding(30)
			.dimension(this.ufDimension)
			.group(this.ufAreaMunGroup)
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.label(function(d) {
				return d.key + ":" + parseInt(Math.round(+d.value));
			})
			.ordinalColors(graph.pallet)
			.legend(dc.legend());

		this.rowTop10ByMun
			.height(fh)
			.width(fw)
			.dimension(this.munDimension)
			.group(utils.snapToZero(this.munAreaMunGroup))
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.label(function(d) {
				return d.key + ": " + parseInt(Math.round(+d.value)) + " km²";
			})
			.elasticX(true)
			.ordinalColors(graph.pallet)
			.ordering(function(d) {
				return d.value;
			})
			.controlsUseVisibility(true);
		
		this.rowTop10ByMun.data(function (group) {
			var fakeGroup=[];
			fakeGroup.push({key:'Sem valor',value:0});
			return (group.all().length>0)?(group.top(10)):(fakeGroup);
		});

		this.rowTop10ByMun.xAxis().tickFormat(function(d) {
			var t=parseInt(d/1000);
			t=(t<=1?t:t+"k");
			return t;
		}).ticks(5);
		
		this.rowTop10ByUc
			.height(fh)
			.width(fw)
			.dimension(this.ucDimension)
			.group(utils.snapToZero(this.ucAreaUcGroup))
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.label(function(d) {
				return d.key + ": " + parseInt(Math.round(+d.value)) + " km²";
			})
			.elasticX(true)
			.ordinalColors(graph.pallet)
			.ordering(function(d) {
				return d.value;
			})
			.controlsUseVisibility(true);
		
		this.rowTop10ByUc.data(function (group) {
			var fakeGroup=[];
			fakeGroup.push({key:'Sem valor',value:0});
			return (group.all().length>0)?(group.top(10)):(fakeGroup);
		});
		
		this.rowTop10ByUc.xAxis().tickFormat(function(d) {
			var t=parseInt(d/1000);
			t=(t<=1?t:t+"k");
			return t;
		}).ticks(5);
		
		dc.renderAll();
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
			graph.barAreaByYear.filterAll();
		}else if(who=='state'){
			graph.pieTotalizedByState.filterAll();
		}else if(who=='mun'){
			graph.rowTop10ByMun.filterAll();
		}else if(who=='uc'){
			graph.rowTop10ByUc.filterAll();
		}
		dc.redrawAll();
	}
};

graph.init();