var utils = {
	config:{},
	printWindow:null,
	statusPrint:false,
	setConfig: function(config) {
		utils.config=config;
	},
	setPagePrint:function() {
		// 1670px
		// 780px
		utils.statusPrint=false;
		utils.printWindow = window.open(window.location.href, "printpage", "width=1670, height=780");
		utils.printWindow.focus();
		utils.printWindow.printNow=function(){
			if(!utils.statusPrint) {
				utils.statusPrint=true;
				utils.printWindow.print();
			}
		};
	},
	btnPrintPage:function() {
		d3.select('#btn_print')
	    .on('click', function() {
	    	window.print();
	    });
	},
	btnDownload:function() {
		d3.select('#btn_down')
	    .on('click', function() {
	        var blob = new Blob([d3.csv.format(graph.data)], {type: "text/csv;charset=utf-8"});
	        saveAs(blob, 'deter-b-agregado-mensal.csv');
	    });
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
	renderAll:function() {
		dc.renderAll("agrega");
		dc.renderAll("filtra");
		utils.addGenerationDate();
		if(parent.opener && parent.opener.utils.printWindow) {
			setTimeout(parent.opener.utils.printWindow.printNow,1000);
		}
	},
	// Used to update the footer position and date.
	addGenerationDate: function() {
		var footer_page=document.getElementById("footer_page");
		var footer_print=document.getElementById("footer_print");
		if(!footer_page || !footer_print) {
			return;
		}
		var h=( (window.document.body.clientHeight>window.innerHeight)?(window.document.body.clientHeight):(window.innerHeight - 20) );
		//footer_page.style.top=h+"px";
		footer_print.style.width=window.innerWidth+"px";
		var now=new Date();
		var footer='Gerado por INPE/OBT/DPI/TerraBrasilis em '+now.toLocaleString()+' sob licença <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt_BR">CC BY-SA 4.0</a>';
		footer_page.innerHTML=footer;
		footer_print.innerHTML=footer;
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
	}
};

var graph={
	
	focusChart: null,
	overviewChart: null,
	ringTotalizedByState: null,
	rowTotalizedByClass: null,
	barAreaByYear: null,
	
	monthDimension: null,
	temporalDimension: null,
	areaGroup: null,
	yearDimension0: null,
	classDimension0: null,
	ufDimension0: null,
	yearDimension: null,
	yearGroup: null,
	ufDimension: null,
	ufGroup: null,
	classDimension: null,
	classGroup: null,
	
	data:null,
	
	winWidth: window.innerWidth,
	winHeight: window.innerHeight,
	
	setDimensions: function(dim) {
		this.winWidth=dim.w;
		this.winHeight=dim.h;
	},
	getYears: function() {
		return this.yearDimension.group().all();
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
	setChartReferencies: function() {
		this.focusChart = dc.seriesChart("#agreg", "agrega");
		this.overviewChart = dc.seriesChart("#agreg-overview", "agrega");
		this.ringTotalizedByState = dc.pieChart("#chart-by-state", "filtra");
		this.rowTotalizedByClass = dc.rowChart("#chart-by-class", "filtra");
		this.barAreaByYear = dc.barChart("#chart-by-year", "filtra");
	},
	loadData: function() {
		d3.json("data/deter_month_dashboard1.json", graph.processData);
	},
	processData: function(error, data) {
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
		graph.registerDataOnCrossfilter(data);
		graph.build();
	},
	registerDataOnCrossfilter: function(data) {
		graph.data=data;
		var ndx0 = crossfilter(data),
		ndx1 = crossfilter(data);
		
		this.monthDimension = ndx1.dimension(function(d) {
			var m=utils.fakeMonths(d.Month);
			return m;
		});
		this.temporalDimension = ndx0.dimension(function(d) {
			var m=utils.fakeMonths(d.Month);
			return [d.Year, m];
		});
		this.areaGroup = this.temporalDimension.group().reduceSum(function(d) {
			return d.Area;
		});
		this.yearDimension0 = ndx0.dimension(function(d) {
			return d.Year;
		});
		this.classDimension0 = ndx0.dimension(function(d) {
			return d.cl;
		});
		this.ufDimension0 = ndx0.dimension(function(d) {
			return d.uf;
		});
		this.yearDimension = ndx1.dimension(function(d) {
			return d.Year;
		});
		this.yearGroup = this.yearDimension.group().reduceSum(function(d) {
			return d.Area;
		});
		this.ufDimension = ndx1.dimension(function(d) {
			return d.uf;
		});
		this.ufGroup = this.ufDimension.group().reduceSum(function(d) {
			return d.Area;
		});
		this.classDimension = ndx1.dimension(function(d) {
			return d.cl;
		});
		this.classGroup = this.classDimension.group().reduceSum(function(d) {
			return d.Area;
		});
	},
	build: function() {
		var w=parseInt(this.winWidth - (this.winWidth * 0.08)),
		h=parseInt(this.winHeight * 0.3),
		barColors = this.getOrdinalColorsToYears();
		
		this.setChartReferencies();
		
		this.focusChart
			.width(w)
			.height(h)
			.chart(function(c) { return dc.lineChart(c).interpolate('cardinal').renderDataPoints(true).evadeDomainFilter(true); })
			.x(d3.scale.linear().domain([8,19]))
			.renderHorizontalGridLines(true)
			.renderVerticalGridLines(true)
			.brushOn(false)
			.yAxisLabel("Área total (km²)")
			.xAxisLabel("Meses")
			.elasticY(true)
			.yAxisPadding('10%')
			.dimension(this.temporalDimension)
			.group(this.areaGroup)
			.rangeChart(this.overviewChart)
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

		this.focusChart.yAxis().tickFormat(function(d) {
			return d3.format(',d')(d);
		});
		this.focusChart.xAxis().tickFormat(function(d) {
			return utils.xaxis(d);
		});

		this.focusChart.margins().left += 40;
		this.focusChart.margins().top += 30;
		
		this.focusChart.on('filtered', function(chart) {
			if(chart.filter()) {
				graph.monthDimension.filterRange([chart.filter()[0], (chart.filter()[1]+1) ]);
				dc.redrawAll("filtra");
			}
		});

		this.focusChart.colorAccessor(function(d) {
			var i=0,l=barColors.length;
			while(i<l){
				if(barColors[i].key==d.key){
					return barColors[i].color;
				}
				i++;
			}
		});

		this.focusChart.filterPrinter(function(filters) {
			var fp=utils.xaxis(filters[0][0])+" - "+utils.xaxis(filters[0][1]);
			return fp;
		});
		
		this.overviewChart
			.width(w)
		    .height(80)
		    .chart(function(c,_,_,i) {
			    var chart = dc.lineChart(c);
			    if(i===0) {
			    	chart.on('filtered', function (chart) {
			            if (!chart.filter()) {
			                dc.events.trigger(function () {
			                    graph.overviewChart.focusChart().x().domain(graph.overviewChart.focusChart().xOriginalDomain());
			                    graph.overviewChart.focusChart().redraw();
			                    graph.focusChart.filterAll();
			                    graph.monthDimension.filterAll();
			                    dc.redrawAll("filtra");
			                });
			            } else if (!utils.rangesEqual(chart.filter(), graph.overviewChart.focusChart().filter())) {
			                dc.events.trigger(function () {
			                	graph.overviewChart.focusChart().focus(chart.filter());
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
		    .dimension(this.temporalDimension)
			.group(this.areaGroup)
		    .seriesAccessor(function(d) {
				return d.key[0];
			})
			.keyAccessor(function(d) {
				return d.key[1];
			})
			.valueAccessor(function(d) {
				return Math.abs(+(d.value.toFixed(2)));
			});
		this.overviewChart.margins().left += 50;
		this.overviewChart.yAxis().ticks(0);
		this.overviewChart.yAxis().tickFormat(function(d) {
			return d3.format(',d')(d);
		});
		this.overviewChart.xAxis().tickFormat(function(d) {
			return utils.xaxis(d);
		});

		this.overviewChart.round(
			function round(v) {
				var v1 = parseInt(v);
				return v1;
	    	}
		);

		var minWidth=250, maxWidth=600, fw=parseInt((w)/3),
		fh=parseInt((this.winHeight - h) * 0.5);
		// define min width to filter graphs
		fw=((fw<minWidth)?(minWidth):(fw));
		// define max width to filter graphs
		fw=((fw>maxWidth)?(maxWidth):(fw));

		this.ringTotalizedByState
			.height(fh)
			.width(fw)
			.innerRadius(10)
			.externalRadiusPadding(30)
			.dimension(this.ufDimension)
			.group(this.ufGroup)
			.title(function(d) {
				return "Área: " + Math.abs(+(d.value.toFixed(2))) + " km²";
			})
			.label(function(d) {
				return d.key + ":" + parseInt(Math.round(+d.value));
			})
			.ordinalColors(["#FF0000","#FFFF00","#FF00FF","#F8B700","#78CC00","#00FFFF","#56B2EA","#0000FF","#00FF00"])
			.legend(dc.legend());

		this.rowTotalizedByClass
			.height(fh)
			.width(fw)
			.dimension(this.classDimension)
			.group(utils.snapToZero(this.classGroup))
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

		this.rowTotalizedByClass.xAxis().tickFormat(function(d) {
			var t=parseInt(d/1000);
			t=(t<=1?t:t+"k");
			return t;
		}).ticks(5);

		this.barAreaByYear
			.height(fh)
			.width(fw)
			.yAxisLabel("Área (km²)")
			.xAxisLabel("Ano (PRODES)")
			.dimension(this.yearDimension)
			.group(utils.snapToZero(this.yearGroup))
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
		
		dc.chartRegistry.list("filtra").forEach(function(c,i){
			c.on('filtered', function(chart, filter) {
				var filters = chart.filters();

				if(chart.anchorName()=="chart-by-year"){
					if(!filters.length) {
						graph.yearDimension0.filterAll();
					}else {
						graph.yearDimension0.filterFunction(function (d) {
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
						graph.classDimension0.filterAll();
					}else {
						graph.classDimension0.filterFunction(function (d) {
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
						graph.ufDimension0.filterAll();
					}else {
						graph.ufDimension0.filterFunction(function (d) {
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
	},
	init: function() {
		window.onresize=utils.onResize;
		this.loadData();
		utils.btnPrintPage();
		utils.btnDownload();
	},
	/*
	 * Called from the UI controls to clear one specific filter.
	 */
	resetFilter: function(who,group) {
		var g=(typeof group === 'undefined')?("filtra"):(group);
		if(who=='state'){
			graph.ringTotalizedByState.filterAll();
		}else if(who=='class'){
			graph.rowTotalizedByClass.filterAll();
		}else if(who=='year'){
			graph.barAreaByYear.filterAll();
		}else if(who=='agreg'){
			graph.overviewChart.filterAll();
			graph.focusChart.filterAll();
			graph.monthDimension.filterAll();
			dc.redrawAll("filtra");
		}
		dc.redrawAll(g);
	}
};

graph.init();