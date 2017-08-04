var dashBoard={
		
	jsonData:[],
	alerts:{},
	config:{},
	selectedFilters:{},
	crossFilter:null,
	
	totalizedAreaInfoBox:undefined,// totalized area info box
	totalizedAlertsInfoBox:undefined,// totalized alerts info box
	lineDistributionByMonth:undefined,
	lineAggregation:undefined,
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
		this.lineAggregation = dc.compositeChart("#chart-aggreg");
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
			dashBoard.jsonData = data.features;
			dashBoard.normalizeData();
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
		this.lineAggregation.filterAll();
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
	
	normalizeData:function() {
        var numberFormat = d3.format('.4f');
	    var json=[], years=[], months=[];
        // normalize/parse data
        this.jsonData.forEach(function(d) {
            var o={uf:d.properties.h,className:d.properties.c,county:d.properties.i};
            o.uc = (d.properties.j)?(d.properties.j):('null');
            var auxDate = new Date(d.properties.g + 'T04:00:00.000Z');
            o.timestamp = auxDate.getTime();
            o.areaKm = numberFormat(d.properties.e)*1;
            o.areaUcKm = ((d.properties.f)?(numberFormat(d.properties.f)*1):(0));
            o.k = d.properties.k;// numner of alerts

            o.m = auxDate.getMonth()+1;
            o.y = auxDate.getFullYear();
            auxDate = new Date(o.y+"-"+o.m+"-1");
            o.my = auxDate.getTime();
            
           	months[o.my] = o.areaKm;
            
            json.push(o);
        });

        this.jsonData=json;
        delete json;
	},
	
	build:function() {
		
		var dimensions=[];
		// set crossfilter
		var alerts = crossfilter(this.jsonData);
		dashBoard.crossFilter=alerts;
		dimensions["area"] = alerts.dimension(function(d) {return d.areaKm;}),//alertsAreaDim
		dimensions["county"] = alerts.dimension(function(d) {return d.county+"/"+d.uf;}),//alertsCountyDim
		dimensions["class"] = alerts.dimension(function(d) {return d.className;}),//alertsClassDim
		dimensions["date"] = alerts.dimension(function(d) {return d.timestamp;}),//alertsDateDim
		dimensions["uf"] = alerts.dimension(function(d) {return d.uf;});//alertsStateDim
		dimensions["uc"] = alerts.dimension(function(d) {return d.uc+"/"+d.uf;});//alertsUCDim
		
		alerts.add(this.jsonData.map(function(d) {
	        return {x: d.my, y2:0, y1: +d.areaKm};
	    }));
		
		dimensions["my"] = alerts.dimension(dc.pluck('x'));
        
		grp1 = dimensions["my"].group().reduceSum(dc.pluck('y1'));
        grp2 = dimensions["my"].group().reduceSum(dc.pluck('y2'));
	
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
                p.tot += v.k;
                return p;
            },
            function (p, v) {
                --p.n;
                p.tot -= v.k;
                return p;
            },
            function () { return {n:0,tot:0}; }
        );
		
		/*
		var totalAreaMonthYear = {};
		for(var y=0;y<years.length;y++) {
			for(var m=0;m<month.length;m++) {
				if(!totalAreaMonthYear[years[y]]) {
					totalAreaMonthYear[years[y]] = {};
				}
				totalAreaMonthYear[years[y]][month[m]] = alerts.groupAll().reduce(
			        function (p, v) {
			        	if(v.y==month[m]+"-"+years[y]) {
				            ++p.n;
				            p.t += v.areaKm;
			        	}else{
			        		p.n=0;
			        		p.t=0;
			        	}
			            return p;
			        },
			        function (p, v) {
			        	if(v.y==month[m]+"-"+years[y]) {
				            --p.n;
				            p.t -= v.areaKm;
			        	}else{
			        		p.n=0;
			        		p.t=0;
			        	}
			            return p;
			        },
			        function () { return {n:0,t:0}; }
			    );
			}
		}
		
		var aggregLines=[];
		for(var y=0;y<years.length;y++) {
			for(var m=0;m<month.length;m++) {
				aggregLines.push(dc.lineChart(this.lineAggregation).group(totalAreaMonthYear[years[y]][month[m]]));
			}
		}
		
		*/
		var aggregLines=[];
		aggregLines.push(dc.lineChart(this.lineAggregation)
			.dimension(dim)
			.colors('red')
			.group(grp1, "Top Line")
			.dashStyle([2,2])
		);
		
		
		var groups=[];
		if(dashBoard.config.defaultDimension=="area") {
			groups["class"] = dimensions["class"].group().reduceSum(function(d) {return +d.areaKm;}),//sumAreasByClassGroup
			groups["county"] = dimensions["county"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByCountyGroup
			groups["uf"] = dimensions["uf"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByStateGroup
			groups["date"] = dimensions["date"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByDateGroup
			//groups["month"] = dimensions["month"].group().reduceSum(function(d) {return +d.areaKm;}),//alertsAreaByYearGroup
			groups["uc"] = dimensions["uc"].group().reduceSum(function(d) {return (d.uc!='null')?(+d.areaKm):(0);});//alertsAreaByUCGroup
		}else{
			groups["class"] = dimensions["class"].group().reduceCount(function(d) {return d.className;}),//sumAreasByClassGroup
			groups["county"] = dimensions["county"].group().reduceCount(function(d) {return d.county;}),//alertsAreaByCountyGroup
			groups["uf"] = dimensions["uf"].group().reduceCount(function(d) {return d.uf;}),//alertsAreaByStateGroup
			groups["date"] = dimensions["date"].group().reduceCount(function(d) {return +d.timestamp;}),//alertsAreaByDateGroup
			//groups["month"] = dimensions["month"].group().reduceCount(function(d) {return +d.timestamp;}),//alertsAreaByYearGroup
			groups["uc"] = dimensions["uc"].group().reduceSum(function(d) {return (d.uc!='null')?(1):(0);});//alertsAreaByUCGroup
		}
		/*
		var aggregLines=[];
		for(var y=0;y<years.length;y++) {
			for(var m=0;m<month.length;m++) {
				
				var gMonth = dimensions["'"+years[y]+"'"]["'"+month[m]+"'"].group().reduceSum(function(d) {
					return +d.areaKm;
				});
				
				aggregLines.push(dc.lineChart(this.lineAggregation).group(gMonth));
			}
		}
		*/
		this.totalizedAreaInfoBox.formatNumber(localeBR.numberFormat(',1f'));
		this.totalizedAreaInfoBox.valueAccessor(function(d) {return d.n ? d.tot.toFixed(1) : 0;})
	      .html({
	          one:"<span style='color:steelblue; font-size: 36px;'>%number</span> km²",
	          some:"<span style='color:steelblue; font-size: 36px;'>%number</span> km²",
	          none:"<span style='color:steelblue; font-size: 36px;'>0</span> km²"
	      })
	      .group(totalAreaGroup);
		

		// build totalized Alerts box
		// use format integer see: http://koaning.s3-website-us-west-2.amazonaws.com/html/d3format.html
		this.totalizedAlertsInfoBox.formatNumber(localeBR.numberFormat(','));
		this.totalizedAlertsInfoBox.valueAccessor(function(d) {
			return d.n ? d.tot : 0;
		})
	      .html({
	          one:"<span style='color:#ffff00; font-size: 36px;'>%number</span> alerta",
	          some:"<span style='color:#ffff00; font-size: 36px;'>%number</span> alertas",
	          none:"<span style='color:#ffff00; font-size: 36px;'>0</span> alerta"
	      })
	      .group(totalAlertsGroup);
		
		//this.buildCharts(dimensions, groups, aggregLines);
		this.buildCharts(dimensions, groups);
	},
	
	changeSelectedYear:function(list) {
		console.log(list[list.selectedIndex].value);
	},
	
	buildCharts:function(dimensions,groups) {
		
		var alertsMaxDate = dimensions["date"].top(1),
		alertsMinDate = dimensions["date"].bottom(1);
		
		// build area or alerts by time
		// -----------------------------------------------------------------------
		dashBoard.utils.setTitle('timeline','Distribuição de %dim% no tempo (granularidade mensal)');

		var lastDate=new Date(alertsMaxDate[0].timestamp),
		firstDate=new Date(alertsMinDate[0].timestamp);
		lastDate=new Date(lastDate.setMonth(lastDate.getMonth()+1));
		lastDate=new Date(lastDate.setDate(lastDate.getDate()+7));
		firstDate=new Date(firstDate.setDate(firstDate.getDate()-7));
		
		var dateFormat = d3.time.format('%b %Y');
		var x = d3.time.scale().domain([firstDate, lastDate]);
		
		this.lineDistributionByMonth
			.margins({top: 10, right: 15, bottom: 35, left: 40})
			.yAxisLabel( dashBoard.utils.wildcardExchange("%Unit%") )
			.xAxisLabel( dateFormat(new Date(alertsMinDate[0].timestamp)) + " - " + dateFormat(new Date(alertsMaxDate[0].timestamp)) )
			.dimension(dimensions["date"])
			.group(groups["date"])
			.transitionDuration(300)
			.elasticY(true)
			.x(x)
			.renderHorizontalGridLines(true)
			.renderVerticalGridLines(true)
			.colors(d3.scale.ordinal().range(['yellow']));

		this.lineDistributionByMonth
			.on('preRender', function(chart) {
				chart
				.xUnits(d3.time.months)
				.xAxis(d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.ticks(d3.time.months)
					.tickFormat(d3.time.format("%b/%Y"))
					//.ticks((chart.effectiveWidth()<dashBoard.config.minWidth)?(d3.time.months):(d3.time.weeks))
				);
			});

        this.lineDistributionByMonth
		.filterPrinter(function(f) {
			var dt=new Date(f[0][0].toISOString());
			dt.setMonth(dt.getMonth()+1);
			return (dt.getMonth()==f[0][1].getMonth() && dt.getFullYear()==f[0][1].getFullYear())?dateFormat(dt):dateFormat(dt) + ' - ' + dateFormat(f[0][1]);
		});

		// -----------------------------------------------------------------------
        
		// build aggregation chart
		// -----------------------------------------------------------------------
      /*  
        var minYear=(new Date(alertsMinDate[0].timestamp)).getFullYear();
        var maxYears=(new Date(alertsMaxDate[0].timestamp)).getFullYear();
        var selectYears='<select class="selectpicker" onchange="dashBoard.changeSelectedYear(this);">';
        for(var s=minYear;s<=maxYears;s++) {
        	selectYears+='<option value="'+s+'">'+s+'</option>';
        }
        selectYears+='</select>';
        
		dashBoard.utils.setTitle('aggreg','Distribuição de %dim% no tempo (granularidade mensal para o ano '+selectYears+')');

		var startRange=new Date(minYear+'-01-01');
		startRange.setUTCHours(+2);
		var endRange=new Date(minYear+'-12-31');
		endRange.setUTCHours(+2);
		var xa = d3.time.scale().domain([startRange,endRange]);*/
		/*
		this.lineAggregation
			.margins({top: 10, right: 15, bottom: 35, left: 40})
			.dimension(dimensions["month"])
			.transitionDuration(300)
			.elasticY(true)
			.brushOn(false)
			.valueAccessor(function (d) {
			    return d.value;
			})
			.title(function (d) {
			    return "\nNumber of properties: " + d.key;
			
			})
			.x(d3.scale.linear().domain([1, 12]))
			.compose(aggregLines);
		*/
		
/*		this.lineAggregation
			.margins({top: 10, right: 15, bottom: 35, left: 40})
			.yAxisLabel(dashBoard.utils.wildcardExchange("%Unit%"))
			.xAxisLabel( startRange.toLocaleDateString() + " - " + endRange.toLocaleDateString() )
			.dimension(dimensions["year"])
			.group(groups["year"])
			.transitionDuration(300)
			.elasticY(true)
			.brushOn(false)
			.valueAccessor(function (d) {
			    return d.value;
			})
			.title(function (d) {
			    return "\nNumber of Povetry: " + d.key;
			
			})
			.x(d3.scale.linear().domain([4, 27]))
			.compose([
			    dc.lineChart(this.lineAggregation).group(years["2015"]),
			    dc.lineChart(this.lineAggregation).group(years["2016"])
			]);*/
			
			/*
			.x(xa)
			.renderHorizontalGridLines(true)
			.colors(d3.scale.ordinal().range(['yellow']));*/

/*		this.lineAggregation
			.on('preRender', function(chart) {
				chart
				.xUnits(d3.time.months)
				.xAxis(d3.svg.axis()
					.scale(xa)
					.orient("bottom")
					.ticks(d3.time.months)
					.tickFormat(d3.time.format("%b") )
				);
			});

        this.lineAggregation
		.filterPrinter(function(f) {
			dashBoard.selectedFilters.startDate=f[0][0];
            dashBoard.selectedFilters.endDate=f[0][1];
			return f[0][0].toLocaleDateString() + ' - ' + f[0][1].toLocaleDateString();
		});*/

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
			    d.areaKm = parseFloat(d.areaKm.toFixed(4));
			    d.areaUcKm = parseFloat(d.areaUcKm.toFixed(4));
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