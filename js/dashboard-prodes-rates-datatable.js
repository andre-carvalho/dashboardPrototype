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
	}
};

var graph={

	barRateByYear: null,
	pieTotalizedByState: null,

	yearDimension: null,
	ufDimension: null,
	yearRateGroup: null,
	ufRateGroup: null,
	yearRateGroupTable: null,
	yearRateRank: null,

	data:null,

	winWidth: window.innerWidth,
	winHeight: window.innerHeight,

	pallet: ["#FF0000","#FF4500","#ff6a00","#FF8C00","#FFA500","#FFD700","#FFFF00","#DA70D6","#BA55D3","#7B68EE"],

	setDimensions: function(dim) {
		this.winWidth=dim.w;
		this.winHeight=dim.h;
	},
	setChartReferencies: function() {
		this.dataTable = dc.dataTable("#data-table");
	},
	loadData: function() {
		// baixar os dados do PRODES!!
		// http://terrabrasilis.info/prodes-data/PRODES/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=PRODES:prodes_rates_d&outputFormat=application%2Fjson
		d3.json("data/prodes_rates.json", graph.processData);
	},
	processData: function(error, data) {
		if (error) throw error;

		var o=[];
		for (var j = 0, n = data.totalFeatures; j < n; ++j) {
			var fet=data.features[j];
			var dt=new Date(fet.properties.year.replace('Z', 'T22:00:00.000Z'));
			o.push({
				uf:fet.properties.state,
				year:dt,
				rate:+fet.properties.rate,
				yearState:fet.properties.state + '/' + dt.getFullYear()
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
		this.rateDimension = ndx.dimension(function(d) {
			return d.rate;
		});

		this.yearRateGroup = this.yearDimension.group().reduceSum(function(d) {
			return +d.rate;
		});
		this.ufRateGroup = this.ufDimension.group().reduceSum(function(d) {
			return +d.rate;
		});


		this.yearStateDimension = ndx.dimension(function(d){
			return d.yearState;
		});
		this.yearStateGroup = this.yearStateDimension.group().reduceSum(function(d) {
			return +d.rate;
		});



    	this.yearRateGroupTable = this.ufDimension.group().reduce(
          function (p, v) {
              ++p.number;
              p.total += +v.rate;
              p.avg = Math.round(p.total / p.number);
              return p;
          },
          function (p, v) {
              --p.number;
              p.total -= +v.rate;
              p.avg = (p.number == 0) ? 0 : Math.round(p.total / p.number);
              return p;
          },
          function () {
              return {number: 0, total: 0, avg: 0}
      });
      this.yearRateRank = function (p) { return "Rate rank" };

	},
	build: function() {
		var w=parseInt(this.winWidth - (this.winWidth * 0.05)),
		h=parseInt(this.winHeight * 0.3);

		this.setChartReferencies();

		var fw=parseInt(w),
		fh=parseInt((this.winHeight - h) * 0.6);

			/*
			this.dataTable
				.width(fw)
			    .height(fh)
			    .dimension(this.yearRateGroupTable)
			    .group(this.yearRateRank)
			    .columns([function (d) { return d.key; },
			              function (d) { return d.value.number; },
			              function (d) { return d.value.avg; }])
			    .sortBy(function (d) {
					return d.value.avg;
				})
			    .order(d3.descending);
			*/

			var yearCols=[];
			yearCols.push({
				label: 'State',
				format: function(d) {
					return d.uf;
				}
			});
			var ctl=[];
			this.yearStateGroup.all().forEach(
				function (y) {
					if(ctl.indexOf(y.key.split("/")[1])<0) {
						ctl.push(y.key.split("/")[1]);
						yearCols.push({
							label: y.key.split("/")[1],
							format: function(d) {
								return +d.rate;
							}
						});
					}
				}
			);

			this.dataTable
			    .dimension(this.ufRateGroup)
			    .group(function(d) {
					return d.uf;
			    })
			    .sortBy(function(d) {
					return +d.year;
				})
			    .showGroups(false)
				.columns(yearCols);
				/*
			    .columns([
			              {
			                  label: 'State',
			                  format: function(d) {
			                      return d.uf;
			                  }
			              },
			              {
			                  label: 'Rate (km²)',
			                  format: function(d) {
			                      return d.rate + ' km²';
			                  }
			              },
			              {
			                  label: 'Year',
			                  format: function(d) {
			                      return d.year.getFullYear();
			                  }
			              }]);
			*/

		dc.renderAll();
	},
	init: function() {
		window.onresize=utils.onResize;
		this.loadData();
	}
};

graph.init();
