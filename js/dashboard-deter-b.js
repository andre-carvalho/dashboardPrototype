var dashBoard={
		
	jsonData:[],
	alerts:{},
	config:{},
	selectedFilters:{},
	
	totalizedAreaInfoBox:undefined,// totalized area info box
	totalizedAlertsInfoBox:undefined,// totalized alerts info box
	lineDistributionByMonth:undefined,
	ringTotalizedByClass:undefined,
    histTopByCounties:undefined,
    ringTotalizedByState:undefined,
    histTopByUCs:undefined,
	
	init:function(config) {
		
		this.config=config;
		this.config.defaultHeight = dashBoard.utils.getDefaultHeight();
		
		this.totalizedAreaInfoBox = dc.numberDisplay("#totalized-area");
		this.totalizedAlertsInfoBox = dc.numberDisplay("#totalized-alerts");
		this.lineDistributionByMonth = dc.barChart("#chart-line-by-month");
		this.compositeBarChartPRODES = dc.compositeChart("#compositeBarChartPRODES");
		this.ringTotalizedByClass = dc.pieChart("#chart-ring-by-class");
		this.histTopByCounties = dc.rowChart("#chart-hist-top-counties");
		this.ringTotalizedByState = dc.pieChart("#chart-ring-by-state");
		this.histTopByUCs = dc.rowChart("#chart-hist-top-ucs");
		
		/*
	    var typeHistogram = config.configLayer.stateAttribute;// default value
		functions.Layer.getJsonDataTable(this.build, config);
		*/
		
		//d3.json("file:///home/dados/workspace-terrabrasilis-deter/DashBoardPrototype/data/daterb_to_dashboard.json", this.loadData);
		this.loadData(false, dados);
	},
	
	loadData: function(error, data) {
		if(error) {
	    	console.log(error);
		}else{
			dashBoard.jsonData = data;
			dashBoard.build();
		}
	},
	
	setDimension: function(dim) {
		this.config.defaultDimension=dim;
		this.resetFilters();
		this.init(this.config);
	},
	
	resetFilters:function() {
		this.lineDistributionByMonth.filterAll();
		this.compositeBarChartPRODES.filterAll();
		this.ringTotalizedByClass.filterAll();
		this.histTopByCounties.filterAll();
		this.ringTotalizedByState.filterAll();
		this.histTopByUCs.filterAll();
	},

	utils:{
		/*
		 * Remove numeric values less than 1e-6
		 */
		removeLittlestValues:function(sourceGroup) {
			return {
				all:function () {
					return sourceGroup.all().filter(function(d) {
						return (Math.abs(d.value)<1e-6) ? 0 : d.value;
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
		},

		/* Insert a title into one chart using a div provided by elementId.
		   Use %dim% or %Dim% to insert a dimension name or capitalize first letter of the name into your title string.
		 */
		setTitle:function(elementId, title) {
			elementId='title-chart-'+elementId;
			document.getElementById(elementId).innerHTML=this.wildcardExchange(title);
		},
		
		wildcardExchange:function(str) {
			var dim=((dashBoard.config.defaultDimension=='area')?('área'):('alerta'));
			var unit=((dashBoard.config.defaultDimension=='area')?('km²'):('alerta(s)'));
			str=str.replace(/%dim%/gi,function(x){return (x=='%Dim%'?dim.charAt(0).toUpperCase()+dim.slice(1):dim);});
			str=str.replace(/%unit%/gi,function(x){return (x=='%Unit%'?unit.charAt(0).toUpperCase()+unit.slice(1):unit);});
			return str;
		},
		
		numberByUnit:function(num) {
			return ((dashBoard.config.defaultDimension=='area')?(num.toFixed(2)):(num.toFixed(0)));
		},

		onResize:function(event) {
			clearTimeout(dashBoard.config.resizeTimeout);
  			dashBoard.config.resizeTimeout = setTimeout(dashBoard.renderAll, 100);
		},

		getDefaultHeight:function() {
			return ((window.innerHeight*0.5).toFixed(0))*1;
		}

	},

	renderAll:function() {
		dashBoard.config.defaultHeight = dashBoard.utils.getDefaultHeight();
		dc.renderAll();
	},
	
	build:function() {
		
		//var dateFormat = d3.time.format('%Y-%m-%d');
	    var numberFormat = d3.format('.4f');
	    
		// normalize/parse data
		this.jsonData.forEach(function(d) {
		    var auxDate = new Date(d.date+'T10:00:00Z');
		    d.timestamp = auxDate.getTime();
		    d.areaKm = numberFormat(d.areaKm)*1;
		});
		var dimensions=[];
		// set crossfilter
		var alerts = crossfilter(this.jsonData);
		
		dimensions["area"] = alerts.dimension(function(d) {return d.areaKm;}),//alertsAreaDim
		dimensions["county"] = alerts.dimension(function(d) {return d.county+"/"+d.uf;}),//alertsCountyDim
		dimensions["class"] = alerts.dimension(function(d) {return d.className;}),//alertsClassDim
		dimensions["date"] = alerts.dimension(function(d) {return d.timestamp;}),//alertsDateDim
		dimensions["month"] = alerts.dimension(function(d) {return (new Date(d.timestamp)).getMonth()+1;}),//alertsMonthDim
		dimensions["uf"] = alerts.dimension(function(d) {return d.uf;});//alertsStateDim
		dimensions["uc"] = alerts.dimension(function(d) {return d.uc+"/"+d.uf;});//alertsUCDim
		
		var totalAreaGroup = alerts.groupAll().reduce(
	            function (p, v) {
	                ++p.n;
	                p.tot += v.areaKm;
	                return p;
	            },
	            function (p, v) {
	                --p.n;
	                p.tot -= v.areaKm;
	                return p;
	            },
	            function () { return {n:0,tot:0}; }
	        ),
		    totalAlertsGroup = alerts.groupAll().reduce(
	            function (p, v) {
	                ++p.n;
	                return p;
	            },
	            function (p, v) {
	                --p.n;
	                return p;
	            },
	            function () { return {n:0,tot:0}; }
	        ),
	        totalAreaByMonthGroup = alerts.groupAll().reduce(
	            function (p, v) {
	                ++p.n;
	                p.c1 += ( (p.className=="DESMATAMENTO_CR")?(v.areaKm):(0) );
	                p.c2 += ( (p.className=="CORTE_SELETIVO")?(v.areaKm):(0) );
	                return p;
	            },
	            function (p, v) {
	                --p.n;
	                p.c1 -= ( (p.className=="DESMATAMENTO_CR")?(v.areaKm):(0) );
	                p.c2 -= ( (p.className=="CORTE_SELETIVO")?(v.areaKm):(0) );
	                return p;
	            },
	            function () { return {n:0,"DESMATAMENTO_CR":0,"CORTE_SELETIVO":0,"DEGRADACAO":0,"CS_DESORDENADO":0,"DESMATAMENTO_VEG":0,"MINERACAO":0}; }
	        );
		
		var groups=[];
		//groups["month"] = dimensions["month"].groupAll().reduce(function(d) {return {clazz:d.className,area:d.areaKm};});
		if(dashBoard.config.defaultDimension=="area") {
			groups["class"] = dimensions["class"].group().reduceSum(function(d) {return +d.areaKm;}),//sumAreasByClassGroup
			groups["county"] = dimensions["county"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByCountyGroup
			groups["uf"] = dimensions["uf"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByStateGroup
			groups["date"] = dimensions["date"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByDateGroup
			groups["uc"] = dimensions["uc"].group().reduceSum(function(d) {return (d.uc!='null')?(+d.areaKm):(0);});//alertsAreaByUCGroup
		}else {
			groups["class"] = dimensions["class"].group().reduceCount(function(d) {return d.className;}),//sumAreasByClassGroup
			groups["county"] = dimensions["county"].group().reduceCount(function(d) {return d.county;}),//alertsAreaByCountyGroup
			groups["uf"] = dimensions["uf"].group().reduceCount(function(d) {return d.uf;}),//alertsAreaByStateGroup
			groups["date"] = dimensions["date"].group().reduceCount(function(d) {return +d.timestamp;}),//alertsAreaByDateGroup
			groups["uc"] = dimensions["uc"].group().reduceSum(function(d) {return (d.uc!='null')?(1):(0);});//alertsAreaByUCGroup
		}
		
		this.totalizedAreaInfoBox.formatNumber(d3.format('.1f'));
		this.totalizedAreaInfoBox.valueAccessor(function(d) {return d.n ? d.tot.toFixed(1) : 0;})
	      .html({
	          one:"<span style='color:steelblue; font-size: 36px;'>%number</span> km²",
	          some:"<span style='color:steelblue; font-size: 36px;'>%number</span> km²",
	          none:"<span style='color:steelblue; font-size: 36px;'>0</span> km²"
	      })
	      .group(totalAreaGroup);
		

		// build totalized Alerts box
		// use format integer see: http://koaning.s3-website-us-west-2.amazonaws.com/html/d3format.html
		this.totalizedAlertsInfoBox.formatNumber(d3.format('d'));
		this.totalizedAlertsInfoBox.valueAccessor(function(d) {
			return d.n ? d.n : 0;
		})
	      .html({
	          one:"<span style='color:#ffff00; font-size: 36px;'>%number</span> alerta",
	          some:"<span style='color:#ffff00; font-size: 36px;'>%number</span> alertas",
	          none:"<span style='color:#ffff00; font-size: 36px;'>0</span> alerta"
	      })
	      .group(totalAlertsGroup);
		
		this.buildCharts(dimensions, groups, totalAreaByMonthGroup);
	},
	
	buildCharts:function(dimensions, groups, totalAreaByMonthGroup) {
		
		var alertsMaxDate = dimensions["date"].top(1),
		alertsMinDate = dimensions["date"].bottom(1);
		
		// build area or alerts by time
		// -----------------------------------------------------------------------
		dashBoard.utils.setTitle('timeline','Distribuição de %dim% no tempo (granularidade diária)');

		var nextDate=new Date(alertsMaxDate[0].timestamp);
		nextDate=new Date(nextDate.setDate(nextDate.getDate()+1));
		var x = d3.time.scale().domain([new Date(alertsMinDate[0].timestamp),nextDate]);
		this.lineDistributionByMonth
			.margins({top: 10, right: 15, bottom: 35, left: 40})
			.yAxisLabel(dashBoard.utils.wildcardExchange("%Unit%"))
			.xAxisLabel((new Date(alertsMinDate[0].timestamp)).toLocaleDateString() + " - " + (new Date(alertsMaxDate[0].timestamp)).toLocaleDateString())
			.dimension(dimensions["date"])
			.group(groups["date"])
			.transitionDuration(300)
			.elasticY(true)
			.x(x)
			.renderHorizontalGridLines(true)
			.colors(d3.scale.ordinal().range(['yellow']));

		this.lineDistributionByMonth
			.on('preRender', function(chart) {
				chart
				.xUnits(d3.time.days)
				.xAxis(d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.ticks(d3.time.months)
					.tickFormat(d3.time.format( (chart.effectiveWidth()<dashBoard.config.minWidth)?("%b/%Y"):("%d/%b")))
					//.ticks((chart.effectiveWidth()<dashBoard.config.minWidth)?(d3.time.months):(d3.time.weeks))
				);
			});

        this.lineDistributionByMonth
		.filterPrinter(function(f) {
			dashBoard.selectedFilters.startDate=f[0][0];
            dashBoard.selectedFilters.endDate=f[0][1];
			return f[0][0].toLocaleDateString() + ' - ' + f[0][1].toLocaleDateString();
		});

		// -----------------------------------------------------------------------

//        this.compositeBarChartPRODES
        // "DESMATAMENTO_CR":0,"CORTE_SELETIVO":0,"DEGRADACAO":0,"CS_DESORDENADO":0,"DESMATAMENTO_VEG":0,"MINERACAO":0
        var DESMATAMENTO_CR = dc.barChart(this.compositeBarChartPRODES)
        .gap(65)
        .dimension(dimensions["date"])
        .group(totalAreaByMonthGroup)
        .valueAccessor(function (d) {
        	/*
        	var r=0;
        	if(d.className=="DESMATAMENTO_CR") {
        		r=d.area;
        	}*/
            return d.c1;
        });
        
        var CORTE_SELETIVO = dc.barChart(this.compositeBarChartPRODES)
        .gap(65)
        .dimension(dimensions["date"])
        .group(totalAreaByMonthGroup)
        .valueAccessor(function (d) {
        	/*
        	var r=0;
        	if(d.className=="CORTE_SELETIVO") {
        		r=d.area;
        	}*/
            return d.c2;
        });
        /*
        var DEGRADACAO = dc.barChart(this.compositeBarChartPRODES)
        .gap(65)
        .dimension(dimensions["month"])
        .group(totalAreaByMonthGroup)
        .valueAccessor(function (d) {
        	var r=0;
        	if(d.n) {
        		r=d["DEGRADACAO"];
        	}
            return r;
        });
        
        var CS_DESORDENADO = dc.barChart(this.compositeBarChartPRODES)
        .gap(65)
        .dimension(dimensions["month"])
        .group(totalAreaByMonthGroup)
        .valueAccessor(function (d) {
        	var r=0;
        	if(d.n) {
        		r=d["CS_DESORDENADO"];
        	}
            return r;
        });
        
        var DESMATAMENTO_VEG = dc.barChart(this.compositeBarChartPRODES)
        .gap(65)
        .dimension(dimensions["month"])
        .group(totalAreaByMonthGroup)
        .valueAccessor(function (d) {
        	var r=0;
        	if(d.n) {
        		r=d["DESMATAMENTO_VEG"];
        	}
            return r;
        });
        
        var MINERACAO = dc.barChart(this.compositeBarChartPRODES)
        .gap(65)
        .dimension(dimensions["month"])
        .group(totalAreaByMonthGroup)
        .valueAccessor(function (d) {
        	var r=0;
        	if(d.n) {
        		r=d["MINERACAO"];
        	}
            return r;
        });
        */
        this.compositeBarChartPRODES
        .elasticY(true)
        .x(x)
        .xUnits(d3.time.months)
        .round(d3.time.month.round)
        .renderHorizontalGridLines(true)
        .compose([DESMATAMENTO_CR, CORTE_SELETIVO])
        .brushOn(false);//, DEGRADACAO, CS_DESORDENADO, DESMATAMENTO_VEG, MINERACAO])
        
        /*.margins({top: 10, right: 15, bottom: 35, left: 40})
        .x(d3.scale.linear().domain([0,12]))
        .brushOn(false)
        .dimension(dimensions["month"])
        .group(groups["area"])
        .elasticY(true);*/
        
        // End compositeBarChartPRODES
		// -----------------------------------------------------------------------
        
		// build graph areas or alerts by class
		dashBoard.utils.setTitle('class','%Dim% por classes');

		this.ringTotalizedByClass
	        .height(this.config.defaultHeight)
	        .innerRadius(25)
	        .externalRadiusPadding(40)
	        .dimension(dimensions["class"])
	        .group(this.utils.removeLittlestValues(groups["class"]))
	        .colors(d3.scale.category20())
	        //.ordinalColors(["#56B2EA","#E064CD","#F8B700","#78CC00","#034ea1","#FF0000"])
	        .legend(dc.legend());

	        /*
				.horizontal(true)
	        	.legendWidth(this.ringTotalizedByClass.width()-100)
	        	.autoItemWidth(true)
	        */
		this.ringTotalizedByClass
			.on('preRender', function(chart) {
				
				chart.height(dashBoard.config.defaultHeight);
				(chart.width()<dashBoard.config.minWidth)?(chart.cx(230)):(chart.cx(0));
			});

		this.ringTotalizedByClass.title(function(d) {
			return (d.key!='empty')?(d.key + ': ' + dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%")):('Sem valor'); 
		});

		// .externalLabels(30) and .drawPaths(true) to enable external labels
		this.ringTotalizedByClass
			.renderLabel(true)
	        .minAngleForLabel(0.5);
		
		this.ringTotalizedByClass.label(function(d) {
			var txtLabel=(d.key!='empty')?(dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%")):('Sem valor');
			if(dashBoard.ringTotalizedByClass.hasFilter()) {
				var f=dashBoard.ringTotalizedByClass.filters();
				return (f.indexOf(d.key)>=0)?(txtLabel):('');
			}else{
				return txtLabel;
			}
		});

		dc.override(this.ringTotalizedByClass, 'legendables', function() {
			var legendables = this._legendables();
			return legendables.filter(function(l) {
				return l.data > 0;
			});
		});
		
		// build top areas or alerts by county
		dashBoard.utils.setTitle('counties','Top 10 - %dim% por municípios');
		
		this.histTopByCounties
	        .height(this.config.defaultHeight)
		    .dimension(dimensions["county"])
		    .group(this.utils.removeLittlestValues(groups["county"]))
		    .elasticX(true)
		    .ordering(function(d) {return d.county;})
		    .controlsUseVisibility(true);

		this.histTopByCounties
			.on('preRender', function(chart) {
				chart.height(dashBoard.config.defaultHeight);
				chart.xAxis().ticks((chart.width()<dashBoard.config.minWidth)?(5):(6));
			});

		this.histTopByCounties.xAxis()
		.tickFormat(function(d) {return d+dashBoard.utils.wildcardExchange(" %unit%");});

		this.histTopByCounties.data(function (group) {
				var fakeGroup=[];
				fakeGroup.push({key:'Sem valor',value:0});
				return (group.all().length>0)?(group.top(10)):(fakeGroup);
			});
		this.histTopByCounties.title(function(d) {return d.key + ': ' + dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%");});
		this.histTopByCounties.label(function(d) {return d.key + ': ' + dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%");});
		

		// build graph areas or alerts by state
		dashBoard.utils.setTitle('state','%Dim% por estados');
		
		this.ringTotalizedByState
	        .height(this.config.defaultHeight)
	        .innerRadius(25)
	        .externalRadiusPadding(40)
	        .dimension(dimensions["uf"])
	        .group(this.utils.removeLittlestValues(groups["uf"]))
	        .colors(d3.scale.category20())
	        .legend(dc.legend());
	        //.ordinalColors(["#56B2EA","#E064CD","#F8B700","#78CC00","#034ea1","#FF0000","#FFFF00","#00FF00"])
	        // .externalLabels(30) and .drawPaths(true) to enable external labels
		this.ringTotalizedByState.title(function(d) { 
			return (d.key!='empty')?(d.key + ': ' + dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%")):('Sem valor');
		});

		this.ringTotalizedByState
			.on('preRender', function(chart) {
				
				chart.height(dashBoard.config.defaultHeight);
				(chart.width()<dashBoard.config.minWidth)?(chart.cx(230)):(chart.cx(0));
			});

		this.ringTotalizedByState
			.renderLabel(true)
			.minAngleForLabel(0.5);

		this.ringTotalizedByState.label(function(d) {
			var txtLabel=(d.key!='empty')?(dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%")):('Sem valor');
			if(dashBoard.ringTotalizedByState.hasFilter()) {
				var f=dashBoard.ringTotalizedByState.filters();
				return (f.indexOf(d.key)>=0)?(txtLabel):('');
			}else{
				return txtLabel;
			}
		});

		dc.override(this.ringTotalizedByState, 'legendables', function() {
			var legendables = this._legendables();
			return legendables.filter(function(l) {
				return l.data > 0;
			});
		});
		
		// build top areas or alerts by state
		dashBoard.utils.setTitle('ucs','Top 10 - %dim% por unidades de conservação');

		this.histTopByUCs
			.height(this.config.defaultHeight)
		    .dimension(dimensions["uc"])
		    .group(this.utils.removeLittlestValues(groups["uc"]))
		    .elasticX(true)
		    .ordering(function(d) { return d.uc; })
		    .controlsUseVisibility(true);

		this.histTopByUCs
			.on('preRender', function(chart) {
				chart.height(dashBoard.config.defaultHeight);
				chart.xAxis().ticks((chart.width()<dashBoard.config.minWidth)?(4):(7));
			});
			
		this.histTopByUCs.xAxis().tickFormat(function(d) {return d+dashBoard.utils.wildcardExchange(" %unit%");});
		this.histTopByUCs.data(function (group) {
				var fakeGroup=[];
				fakeGroup.push({key:'Sem valor',value:0});
				return (group.all().length>0)?(group.top(10)):(fakeGroup);
			});
		this.histTopByUCs.title(function(d) {return d.key + ': ' + dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%");});
		this.histTopByUCs.label(function(d) {return d.key + ': ' + dashBoard.utils.numberByUnit(d.value) + dashBoard.utils.wildcardExchange(" %unit%");});

		// build download data
		d3.select('#download')
		    .on('click', function() {
		    	dashBoard.jsonData.forEach(function(d) {
				    delete d.timestamp;
				    d.areaKm = d.areaKm.toFixed(4);
				    d.uc = ((d.uc!='null')?(d.uc):(''));
				});
		        var blob = new Blob([d3.csv.format(dashBoard.jsonData)], {type: "text/csv;charset=utf-8"});
		        saveAs(blob, 'data.csv');
		    });
		
		dc.renderAll();
		window.onresize=this.utils.onResize;
	}
	
};

dashBoard.init({defaultDimension:'area', resizeTimeout:0, minWidth:450});