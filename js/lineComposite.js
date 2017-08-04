var focusChart = dc.seriesChart("#test");
var overviewChart = dc.seriesChart("#test-overview");
var ringTotalizedByState = dc.pieChart("#chart-by-state");
var ringTotalizedByClass = dc.pieChart("#chart-by-class");
var barAreaByYear = dc.barChart("#chart-by-year");
var ndx, temporalDimension, yearDimension, monthDimension, ufDimension, classDimension;
var areaGroup, ufGroup, classGroup, yearGroup;
var utils = {
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
			/* case 1:
				return 'Jan';
				break;
			case 2:
				return 'Fev';
				break;
			case 3:
				return 'Mar';
				break;
			case 4:
				return 'Abr';
				break;
			case 5:
				return 'Mai';
				break;
			case 6:
				return 'Jun';
				break;
			case 7:
				return 'Jul';
				break; */
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
			ringTotalizedByClass.filterAll();
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
		o.push({Year:year,Month:month,Area:+((fet.properties.ar).toFixed(2)),uf:fet.properties.uf,cl:fet.properties.cl});
	}
	data = o;

	var w=window.innerWidth - 100, h=window.innerHeight * 0.5;
	
	ndx = crossfilter(data);
	temporalDimension = ndx.dimension(function(d) {
		var m=utils.fakeMonths(d.Month);
		return [d.Year, m];
	});
	
	yearDimension = ndx.dimension(function(d) {
		return d.Year;
	});

	yearGroup = yearDimension.group().reduceSum(function(d) {
		return d.Area;
	});
	
	monthDimension = ndx.dimension(function(d) {
		return d.Month;
	});
	
	ufDimension = ndx.dimension(function(d) {
		return d.uf;
	});

	ufGroup = ufDimension.group().reduceSum(function(d) {
		return d.Area;
	});
	
	classDimension = ndx.dimension(function(d) {
		return d.cl;
	});

	classGroup = classDimension.group().reduceSum(function(d) {
		return d.Area;
	});
	
	areaGroup = temporalDimension.group().reduceSum(function(d) {
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
		//.x(d3.time.scale().domain([new Date('2016-08-01'),new Date('2017-07-31')]))
		//.x(d3.scale.linear().domain([0,13]))
		.x(d3.scale.linear().domain([8,19]))
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
		.brushOn(false)
		.yAxisLabel("Total Area km²")
		.xAxisLabel("Months")
		.elasticY(true)
		.dimension(temporalDimension)
		.group(areaGroup)
		//.brushOn(true)// seleciona área mas não aplica zoom 
		//.mouseZoomable(true)
		.rangeChart(overviewChart)
		.title(function(d) {
			return utils.xaxis(d.key[1]) + " - " + d.key[0]
			+ "\nÁrea: " + Math.abs(+(d.value.toFixed(2))) + " Km²";
		})
		.seriesAccessor(function(d) {
			return d.key[0];
		})
		.keyAccessor(function(d) {
			return d.key[1];
		})
		.valueAccessor(function(d) {
			//console.log(d.key[1] + ":" + d.value);
			return Math.abs(+(d.value.toFixed(2)));
		})
		.legend(dc.legend().x(w-200).y(10).itemHeight(15).gap(5).horizontal(1).legendWidth(200).itemWidth(80));

	focusChart.yAxis().tickFormat(function(d) {
		return d3.format(',d')(d);
	});
	focusChart.xAxis().tickFormat(function(d) {
		return utils.xaxis(d);
	});
	/*
	focusChart.on('renderlet', function(chart) {
		chart.selectAll("circle")
		.style("stroke", "gray")
        .style("fill", "transparent")
        .attr("r", 25).append("text")
	    .attr("text", function(d) {
	    	return d.y + " Km²";
	    });
		
	    chart.selectAll("circle")
	    .append("text")
	    .attr("text", function(d) { return d.value })
	});
	*/
	focusChart.margins().left += 40;
	focusChart.margins().top += 30;
	
	/*focusChart.on('filtered', function(chart) {
	    console.log(chart.filter()[0] + "-" + chart.filter()[1]);
	});*/

	focusChart.colorAccessor(function(d) {
		var i=0,l=barColors.length;
		while(i<l){
			if(barColors[i].key==d.key){
				return barColors[i].color;
			}
			i++;
		}
	});
	
	overviewChart
		.width(w)
	    .height(80)
	    .chart(function(c,_,_,i) {
		    var chart = dc.lineChart(c);
		    if(i===0)
		    	chart.on('filtered', function (chart) {
		            if (!chart.filter()) {
		                dc.events.trigger(function () {
		                    overviewChart.focusChart().x().domain(overviewChart.focusChart().xOriginalDomain());
		                    overviewChart.focusChart().redraw();
		                });
		            } else if (!utils.rangesEqual(chart.filter(), overviewChart.focusChart().filter())) {
		                dc.events.trigger(function () {
		                    overviewChart.focusChart().focus(chart.filter());
		                });
		            }
		        });
		    return chart;
	    })
	    .x(d3.scale.linear().domain([8,19]))
	    .brushOn(true)
	    .xAxisLabel("Months")
	    .clipPadding(10)
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

	ringTotalizedByState
		.height(350)
		.width(550)
		.innerRadius(25)
		.externalRadiusPadding(60)
		.dimension(ufDimension)
		.group(ufGroup)
		//.colors(d3.scale.category20())
		.ordinalColors(["#0000FF","#56B2EA","#00FFFF","#F8B700","#78CC00","#FF00FF","#FF0000","#FFFF00","#00FF00"])
		.legend(dc.legend());
		// .externalLabels(30) and .drawPaths(true) to enable external labels

	ringTotalizedByClass
		.height(350)
		.width(550)
		.innerRadius(25)
		.externalRadiusPadding(60)
		.dimension(classDimension)
		.group(classGroup)
		//.colors(d3.scale.category20())
		.ordinalColors(["#0000FF","#56B2EA","#00FFFF","#F8B700","#78CC00","#FF00FF","#FF0000","#FFFF00","#00FF00"])
		//.legend(dc.legend().x(0).y(0).itemHeight(10).gap(2).horizontal(1).legendWidth(450).itemWidth(130));
		.legend(dc.legend());

	barAreaByYear
		.height(300)
		.width(350)
		.yAxisLabel("Área (Km²)")
		.xAxisLabel("Year (PRODES)")
		.dimension(yearDimension)
		.group(yearGroup)
		.elasticY(true)
		.x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .barPadding(0.2)
		.outerPadding(0.1)
		.renderHorizontalGridLines(true)
		//.ordinalColors(['#FF8D00','#008DFF'])
		.colorAccessor(function(d) {
			var i=0,l=barColors.length;
			while(i<l){
				if(barColors[i].key==d.key){
					return barColors[i].color;
				}
				i++;
			}
		});
		//.colors(d3.scale.ordinal().range(['#FF8D00']));
		
/*
		.colors( ['rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,144)' ] )
		.colorDomain ([0,3])
		.colorAccessor(function(d, i){
			  if(d.key == '2015/2016')
				 return 3;
			  else if(d.key == '2015/2016')
				return 2;
			  else return 1;
		});
*/
	barAreaByYear.margins().left += 50;

/*	focusChart.on('pretransition', function(chart) {
		utils.setControls();
	});*/
	//utils.setControls();
	dc.renderAll();
});