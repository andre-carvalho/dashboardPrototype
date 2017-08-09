
var focusChart = dc.seriesChart("#agreg", "agrega");
var overviewChart = dc.seriesChart("#agreg-overview", "agrega");
var ringTotalizedByState = dc.pieChart("#chart-by-state", "filtra");
var rowTotalizedByClass = dc.rowChart("#chart-by-class", "filtra");
var barAreaByYear = dc.barChart("#chart-by-year", "filtra");
var ndx0,ndx1, temporalDimension, yearDimension, monthDimension, ufDimension, classDimension;
var areaGroup, ufGroup, classGroup, yearGroup;
var utils = {
		config:{},
		setConfig: function(config) {
			this.config=config;
		},
		onResize:function(event) {
			clearTimeout(utils.config.resizeTimeout);
  			utils.config.resizeTimeout = setTimeout(utils.renderAll, 100);
		},
		renderAll:function() {
			dc.renderAll("agrega");
			dc.renderAll("filtra");
			utils.addGenerationDate();
		},
		addGenerationDate: function() {
			var now=new Date();
			var footer='Gerado por INPE/OBT/DPI/TerraBrasilis em '+now.toLocaleString()+' sob licença <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt_BR">CC BY-SA 4.0</a>';
			document.getElementById("generation_date").innerHTML=footer;
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
				}
			};
		},
		rangesEqual: function (range1, range2) {
	        if (!range1 && !range2) {
	            return true;
	        } else if (!range1 || !range2) {
	            return false;
	        } else if (range1.length === 0 && range2.length === 0) {
	            return true;
	        } else if (range1[0].valueOf() === range2[0].valueOf() &&
	            range1[1].valueOf() === range2[1].valueOf()) {
	            return true;
	        }
	        return false;
	    },
		xaxis:function(d) {
			switch (d) {
			case 8:
				return 'Ago';
				break;
			case 9:
				return 'Set';
				break;
			case 10:
				return 'Out';
				break;
			case 11:
				return 'Nov';
				break;
			case 12:
				return 'Dez';
				break;
			case 13:
				return 'Jan';
				break;
			case 14:
				return 'Fev';
				break;
			case 15:
				return 'Mar';
				break;
			case 16:
				return 'Abr';
				break;
			case 17:
				return 'Mai';
				break;
			case 18:
				return 'Jun';
				break;
			case 19:
				return 'Jul';
				break;
			}
		},
	fakeMonths: function(d) {
		switch (d) {
		case 1:
			return 13;
			break;
		case 2:
			return 14;
			break;
		case 3:
			return 15;
			break;
		case 4:
			return 16;
			break;
		case 5:
			return 17;
			break;
		case 6:
			return 18;
			break;
		case 7:
			return 19;
			break;
		case 8:
			return 8;
			break;
		case 9:
			return 9;
			break;
		case 10:
			return 10;
			break;
		case 11:
			return 11;
			break;
		case 12:
			return 12;
			break;
		}
	},
	fakeYears: function(y) {
		return "20"+y+"/20"+(y+1);
	},
	resetFilter: function(who,group) {
		var g=(typeof group === 'undefined')?("filtra"):(group);
		if(who=='state'){
			ringTotalizedByState.filterAll();
		}else if(who=='class'){
			rowTotalizedByClass.filterAll();
		}else if(who=='year'){
			barAreaByYear.filterAll();
		}else if(who=='agreg'){
			overviewChart.filterAll();
			focusChart.filterAll();
			monthDimension.filterAll();
			dc.redrawAll("filtra");
		}
		dc.redrawAll(g);
	},
	getClasses: function() {
		return classDimension.group().all();
	},
	getStates: function() {
		return ufDimension.group().all();
	},
	getMonths: function() {
		return monthDimension.group().all();
	},
	getYears: function() {
		return yearDimension.group().all();
	},
	getRangeYears: function() {
		var ys=this.getYears(), l=ys.length;
		var y=[];
		for(var i=0;i<l;i++) {
			y.push(ys[i].key);
		}
		return y;
	},
	getOrdinalColorsToYears: function(itens) {
		var c=[];
		var ys=this.getRangeYears();
		var cor=d3.scale.category20();
		for(var i=0;i<ys.length;i++) {
			c.push({key:ys[i],color:cor(i)});
		}
		return c;
	},
	setControls: function() {
		var ys=this.getYears(), l=ys.length;
		for(var i=0;i<l;i++) {
			var y=document.getElementById('years');
			var o = document.createElement('option');
			o.text = ys[i].key;
			y.options.add(o);
		}
		/*
		var cl=this.getClasses(), l=cl.length;
		for(var i=0;i<l;i++) {
			var y=document.getElementById('classes');
			var o = document.createElement('option');
			o.text = cl[i].key;
			y.options.add(o);
		}
		var st=this.getStates(), l=st.length;
		for(var i=0;i<l;i++) {
			var y=document.getElementById('states');
			var o = document.createElement('option');
			o.text = st[i].key;
			y.options.add(o);
		}
		*/
	},
	resetControls : function() {
		var y=document.getElementById('years');
		while(y.selectedOptions.length>0) {y.selectedOptions[0].selected=false;};
		/*
		var c=document.getElementById('classes');
		while(c.selectedOptions.length>0) {c.selectedOptions[0].selected=false;};
		var s=document.getElementById('states');
		while(s.selectedOptions.length>0) {s.selectedOptions[0].selected=false;};
		*/
	},
};

var graph = {
		filterByYear: function(y) {
			if(typeof y == 'undefined') {
				return;
			}
			var l=y.selectedOptions;
			yearDimension.filterAll();
			
			if(l.length) {
				var f=[];
				for(var i=0;i<l.length;i++) {
					if(l[i].selected) f.push(l[i].value);
				}
				yearDimension.filterRange(f);
			}
			dc.renderAll();
		},
		filterByMonth: function(f) {
			if(typeof f == 'undefined') {
				return;
			}
			if(f instanceof Array && f.length == 2) {
				monthDimension.filterRange(f);
			}else if(typeof f == 'number') {
				monthDimension.filter(f);
			}
			dc.renderAll();
		},
		filterByClass: function(cl) {
			if(typeof cl == 'undefined') {
				return;
			}
			var l=cl.selectedOptions;
			classDimension.filterAll();
			
			if(l.length) {
				var f=[];
				for(var i=0;i<l.length;i++) {
					if(l[i].selected) f.push(l[i].value);
				}
				classDimension.filter(f);
			}
			dc.renderAll();
		},
		filterByState: function(uf) {
			if(typeof uf == 'undefined') {
				return;
			}
			var l=uf.selectedOptions;
			ufDimension.filterAll();
			if(l.length) {
				
				var f=[];
				for(var i=0;i<l.length;i++) {
					if(l[i].selected) f.push(l[i].value);
				}
				ufDimension.filter(f);
			}
			dc.renderAll();
		},
		filterAll: function() {
			//utils.resetControls();

			//yearDimension.filterAll();
			//classDimension.filterAll();
			//ufDimension.filterAll();

			focusChart.filterAll();
			overviewChart.filterAll();
			ringTotalizedByState.filterAll();
			rowTotalizedByClass.filterAll();
			barAreaByYear.filterAll();
			
			dc.redrawAll();
		}
};

d3.json("data/deter_month_dashboard1.json", function(error, data) {
	
	if (error) throw error;
	
	var o=[];
	
	for (var j = 0, n = data.totalFeatures; j < n; ++j) {
		var fet=data.features[j];
		var month=+fet.properties.m;
		var year=+fet.properties.y;
		if(month >=1 && month<=7) {
			year = "20"+(year-1)+"/20"+year;
		}
		if(month >=8 && month<=12) {
			year = "20"+year+"/20"+(year+1);
		}
		o.push({Year:year,Month:month,Area:+((fet.properties.ar).toFixed(1)),uf:fet.properties.uf,cl:fet.properties.cl});
	}
	data = o;

	var w=parseInt(window.innerWidth - (window.innerWidth * 0.08)),
	h=parseInt(window.innerHeight * 0.3);
	
	ndx0 = crossfilter(data);
	ndx1 = crossfilter(data);
	temporalDimension = ndx0.dimension(function(d) {
		var m=utils.fakeMonths(d.Month);
		return [d.Year, m];
	});
	areaGroup = temporalDimension.group().reduceSum(function(d) {
		return d.Area;
	});

	yearDimension0 = ndx0.dimension(function(d) {
		return d.Year;
	});
	classDimension0 = ndx0.dimension(function(d) {
		return d.cl;
	});
	ufDimension0 = ndx0.dimension(function(d) {
		return d.uf;
	});	

	yearDimension = ndx1.dimension(function(d) {
		return d.Year;
	});

	yearGroup = yearDimension.group().reduceSum(function(d) {
		return d.Area;
	});
	
	monthDimension = ndx1.dimension(function(d) {
		var m=utils.fakeMonths(d.Month);
		return m;
	});
	
	ufDimension = ndx1.dimension(function(d) {
		return d.uf;
	});

	ufGroup = ufDimension.group().reduceSum(function(d) {
		return d.Area;
	});
	
	classDimension = ndx1.dimension(function(d) {
		return d.cl;
	});

	classGroup = classDimension.group().reduceSum(function(d) {
		return d.Area;
	});

	var barColors=utils.getOrdinalColorsToYears();
	
	focusChart
		.width(w)
		.height(h)
		//.chart(dc.scatterPlot)
		//.chart(function(c) { return dc.barChart(c); })
		//.chart(function(c) { return dc.lineChart(c); })
		.chart(function(c) { return dc.lineChart(c).interpolate('cardinal').renderDataPoints(true).evadeDomainFilter(true); })
		//.chart(function(c) { return dc.lineChart(c).interpolate('step-before').evadeDomainFilter(true); })
		/*.chart(function(c) {
			var ch=dc.lineChart(c);
			ch.interpolate('cardinal')
				.renderArea(false)
				.renderDataPoints(true)
				.brushOn(false);
			return ch;
		})*/
		.x(d3.scale.linear().domain([8,19]))
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
		.brushOn(false)
		.yAxisLabel("Área total (km²)")
		.xAxisLabel("Meses")
		.elasticY(true)
		.yAxisPadding('10%')
		.dimension(temporalDimension)
		.group(areaGroup)
		.rangeChart(overviewChart)
		.title(function(d) {
			return utils.xaxis(d.key[1]) + " - " + d.key[0]
			+ "\nÁrea: " + Math.abs(+(d.value.toFixed(2))) + " km²";
		})
		.seriesAccessor(function(d) {
			return d.key[0];
		})
		.keyAccessor(function(d) {
			return d.key[1];
		})
		.valueAccessor(function(d) {
			return Math.abs(+(d.value.toFixed(2)));
		})
		.legend(dc.legend().x(w-200).y(30).itemHeight(15).gap(5).horizontal(1).legendWidth(200).itemWidth(80));

	focusChart.yAxis().tickFormat(function(d) {
		return d3.format(',d')(d);
	});
	focusChart.xAxis().tickFormat(function(d) {
		return utils.xaxis(d);
	});

	focusChart.margins().left += 40;
	focusChart.margins().top += 30;
	
	focusChart.on('filtered', function(chart) {
		if(chart.filter()) {
			monthDimension.filterRange([chart.filter()[0], (chart.filter()[1]+1) ]);
			dc.redrawAll("filtra");
		}
	});

	focusChart.colorAccessor(function(d) {
		var i=0,l=barColors.length;
		while(i<l){
			if(barColors[i].key==d.key){
				return barColors[i].color;
			}
			i++;
		}
	});

	focusChart.filterPrinter(function(filters) {
		var fp=utils.xaxis(filters[0][0])+" - "+utils.xaxis(filters[0][1]);
		return fp;
	});
	
	overviewChart
		.width(w)
	    .height(80)
	    .chart(function(c,_,_,i) {
		    var chart = dc.lineChart(c);
		    if(i===0) {
		    	chart.on('filtered', function (chart) {
		            if (!chart.filter()) {
		                dc.events.trigger(function () {
		                    overviewChart.focusChart().x().domain(overviewChart.focusChart().xOriginalDomain());
		                    overviewChart.focusChart().redraw();
		                    focusChart.filterAll();
		                    monthDimension.filterAll();
		                    dc.redrawAll("filtra");
		                });
		            } else if (!utils.rangesEqual(chart.filter(), overviewChart.focusChart().filter())) {
		                dc.events.trigger(function () {
		                    overviewChart.focusChart().focus(chart.filter());
		                });
		            }
		        });
		    }
		    return chart;
	    })
	    .x(d3.scale.linear().domain([8,19]))
	    .brushOn(true)
	    .xAxisLabel("Seleção temporal (granularidade mensal)")
	    .clipPadding(5)
	    .dimension(temporalDimension)
		.group(areaGroup)
	    .seriesAccessor(function(d) {
			return d.key[0];
		})
		.keyAccessor(function(d) {
			return d.key[1];
		})
		.valueAccessor(function(d) {
			return Math.abs(+(d.value.toFixed(2)));
		});
	overviewChart.margins().left += 50;
	overviewChart.yAxis().ticks(0);
	overviewChart.yAxis().tickFormat(function(d) {
		return d3.format(',d')(d);
	});
	overviewChart.xAxis().tickFormat(function(d) {
		return utils.xaxis(d);
	});

	overviewChart.round(
		function round(v) {
			var v1 = parseInt(v);
			return v1;
    	}
	);

	var fw=parseInt((w-100)/3),
	fh=parseInt((window.innerHeight - h) * 0.5);

	ringTotalizedByState
		.height(fh)
		.width(fw)
		.innerRadius(10)
		.externalRadiusPadding(30)
		.dimension(ufDimension)
		.group(ufGroup)
		.title(function(d) {
			return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
		})
		.label(function(d) {
			return d.key + ":" + parseInt(Math.round(+d.value));
		})
		.ordinalColors(["#FF0000","#FFFF00","#FF00FF","#F8B700","#78CC00","#00FFFF","#56B2EA","#0000FF","#00FF00"])
		.legend(dc.legend());

	rowTotalizedByClass
		.height(fh)
		.width(fw)
		.dimension(classDimension)
		.group(utils.snapToZero(classGroup))
		.title(function(d) {
			return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
		})
		.label(function(d) {
			return d.key + ": " + parseInt(Math.round(+d.value)) + " km²";
		})
		.elasticX(true)
		.ordinalColors(["#FF0000","#FFFF00","#FF00FF","#F8B700","#78CC00","#00FFFF","#56B2EA","#0000FF","#00FF00"])
		.ordering(function(d) {
			return -d.value;
		})
		.controlsUseVisibility(true);

	rowTotalizedByClass.xAxis().tickFormat(function(d) {
		var t=parseInt(d/1000);
		t=(t<=1?t:t+"k");
		return t;
	}).ticks(5);

	barAreaByYear
		.height(fh)
		.width(fw)
		.yAxisLabel("Área (km²)")
		.xAxisLabel("Ano (PRODES)")
		.dimension(yearDimension)
		.group(utils.snapToZero(yearGroup))
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

	barAreaByYear.margins().left += 30;

	dc.chartRegistry.list("filtra").forEach(function(c,i){
		c.on('filtered', function(chart, filter) {
			var filters = chart.filters();

			if(chart.anchorName()=="chart-by-year"){
				if(!filters.length) {
					yearDimension0.filterAll();
				}else {
					yearDimension0.filterFunction(function (d) {
						for (var i = 0; i < filters.length; i++) {
							var f = filters[i];
							if (f.isFiltered && f.isFiltered(d)) {
								return true;
							} else if (f <= d && f >= d) {
								return true;
							}
						}
						return false;
					});
				}
			}
			if(chart.anchorName()=="chart-by-class"){
				if(!filters.length) {
					classDimension0.filterAll();
				}else {
					classDimension0.filterFunction(function (d) {
						for (var i = 0; i < filters.length; i++) {
							var f = filters[i];
							if (f.isFiltered && f.isFiltered(d)) {
								return true;
							} else if (f <= d && f >= d) {
								return true;
							}
						}
						return false;
					});
				}
			}
			if(chart.anchorName()=="chart-by-state"){
				if(!filters.length) {
					ufDimension0.filterAll();
				}else {
					ufDimension0.filterFunction(function (d) {
						for (var i = 0; i < filters.length; i++) {
							var f = filters[i];
							if (f.isFiltered && f.isFiltered(d)) {
								return true;
							} else if (f <= d && f >= d) {
								return true;
							}
						}
						return false;
					});
				}
			}
			dc.redrawAll("agrega");
		});
	});
	utils.renderAll();
});

window.onresize=utils.onResize;