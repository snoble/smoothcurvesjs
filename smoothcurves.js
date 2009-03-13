function getSlopesType1(leftpoint, centrepoint, rightpoint){
  var leftwidth = centrepoint[0]-leftpoint[0];
  var leftrise = centrepoint[1]-leftpoint[1];
  var leftslope = leftrise/leftwidth;
  
  var rightwidth = rightpoint[0] - centrepoint[0];
  var rightrise = rightpoint[1] - centrepoint[1];
  var rightslope = rightrise/rightwidth;
  
  var slope = [];
  slope[0] = (leftslope*rightwidth + rightslope*leftwidth)/(rightwidth+leftwidth);
  slope[1] = (slope[0] - leftslope)/(leftwidth/2);
  return slope;
} 

function getSlopesType2(leftpoint, centrepoint, rightpoint){
  if(this.smoother == null)
    this.setSmootherCoef(1);
  var leftwidth = centrepoint[0]-leftpoint[0];
  var leftrise = centrepoint[1]-leftpoint[1];
  var leftslope = leftrise/leftwidth;
  
  var rightwidth = rightpoint[0] - centrepoint[0];
  var rightrise = rightpoint[1] - centrepoint[1];
  var rightslope = rightrise/rightwidth;
  
  var slope = [];
  if(leftslope <= 0 && rightslope >= 0){
    slope[0] = 0;
    slope[1] = Math.min((0-leftslope)/(leftwidth/2), (rightslope-0)/(rightwidth/2));
  }else if(leftslope >= 0 && rightslope <= 0){
    slope[0] = 0;
    slope[1] = Math.max((0-leftslope)/(leftwidth/2), (rightslope-0)/(rightwidth/2));
  }else if(Math.abs(leftslope) <= this.smoother || Math.abs(rightslope) <= this.smoother){
    var mult = Math.min(Math.abs(rightslope), Math.abs(leftslope))/this.smoother;
    if (Math.abs(rightslope) < Math.abs(leftslope)){
      slope[0] = (leftslope*rightwidth*mult + rightslope*leftwidth)/(rightwidth*mult+leftwidth);
      slope[1] = (rightslope - slope[0])/(rightwidth/2);
    }else{
      slope[0] = (leftslope*rightwidth + rightslope*leftwidth*mult)/(rightwidth+leftwidth*mult);
      slope[1] = (slope[0] - leftslope)/(leftwidth/2);
    }
  }else{
    slope[0] = (leftslope*rightwidth + rightslope*leftwidth)/(rightwidth+leftwidth);
    slope[1] = (slope[0] - leftslope)/(leftwidth/2);
  }
  return slope;
}

function getSlopesFrom3P(leftpoint, centrepoint, rightpoint, sane){
  var leftwidth = centrepoint[0]-leftpoint[0];
  var leftrise = centrepoint[1]-leftpoint[1];
  var leftslope = leftrise/leftwidth;
  
  var rightwidth = rightpoint[0] - centrepoint[0];
  var rightrise = rightpoint[1] - centrepoint[1];
  var rightslope = rightrise/rightwidth;
  
  var slope = [];
  if(sane && ((leftslope <= 0 && rightslope >= 0) || (leftslope >= 0 && rightslope <= 0))){
    slope[0] = 0;
  }else{
    slope[0] = (leftslope*rightwidth + rightslope*leftwidth)/(rightwidth+leftwidth);
  }
  slope[1] = 0;
  if(!sane) return slope; 
  slope = getSaneSlope(leftpoint, centrepoint, rightpoint, slope);
  return slope;
}

function getSlopesType3(leftpoint, centrepoint, rightpoint, llpoint, rrpoint){
  var sane = this.sane;
  var ls = this.getSlopesFrom3P(llpoint, leftpoint, centrepoint, sane)[0];
  var rs = this.getSlopesFrom3P(centrepoint, rightpoint, rrpoint, sane)[0];
  var frac = 1/4;
  var lwidth = frac*(centrepoint[0]-leftpoint[0]);
  var nlp = [leftpoint[0]+lwidth, leftpoint[1]+ls*lwidth];
  var rwidth = frac*(rightpoint[0] - centrepoint[0]);
  var nrp = [rightpoint[0]-rwidth, rightpoint[1]-rs*rwidth];
  var slope = this.getSlopesFrom3P(nlp, centrepoint, nrp, sane);
  if(!sane) return slope;
  return getSaneSlope(leftpoint, centrepoint, rightpoint, slope);
}

function getSaneSlope(leftpoint, centrepoint, rightpoint, slope){
  var leftwidth = centrepoint[0]-leftpoint[0];
  var leftrise = centrepoint[1]-leftpoint[1];
  var leftslope = leftrise/leftwidth;
  
  var rightwidth = rightpoint[0] - centrepoint[0];
  var rightrise = rightpoint[1] - centrepoint[1];
  var rightslope = rightrise/rightwidth;

  if(Math.abs(slope[0]) >= 3*Math.abs(rightslope)){
    slope[0] = 3*rightslope;
  }
  if(Math.abs(slope[0]) >= 3*Math.abs(leftslope)){
    slope[0] = 3*leftslope;
  }
  return slope;
}

function setSane(s){
  this.sane = s;
}

function PlotSmoother(slopetype, degree){
  this.setSmootherCoef(1);
  this.slopefunctions = {1: getSlopesType1, 2: getSlopesFrom3P, 3:getSlopesType3};
  this.polyfunctions = {1: getPoly1, 2: getPoly2};
  if(slopetype == null) slopetype = 1;
  if(degree == null) degree = 1;
  this.setSlopeType(slopetype);
  this.setDiffDegree(degree);
  this.sane = false;
  this.dotpitch = 0.02;
}

function setDotPitch(x){
  this.dotpitch = x;
}

function setSmootherCoef(n){
  this.smoother = n;
}

function setSlopeType(slopetype){
  this.getSlopes = this.slopefunctions[slopetype];
}

function setDiffDegree(degree){
  this.getPoly = this.polyfunctions[degree];
}

function smooth(rawdata){
  var fp = rawdata[0];
  rawdata.unshift([fp[0]-1, fp[1]]);
  rawdata.unshift([fp[0]-2, fp[1]]);
  var lp = rawdata[rawdata.length - 1];
  rawdata.push([lp[0]+1, lp[1]]);
  rawdata.push([lp[0]+2, lp[1]]);
  var d1 = [];
  for (j = 2; j < rawdata.length -3; j += 1){
    var realwidth = rawdata[j+1][0] - rawdata[j][0];
    var xb = (rawdata[j-1][0] - rawdata[j][0])/realwidth;
    var xn = (rawdata[j+2][0] - rawdata[j][0])/realwidth;
    var leftslopes = this.getSlopes(rawdata[j-1], rawdata[j], rawdata[j+1], rawdata[j-2], rawdata[j+2]);
    var rightslopes = this.getSlopes(rawdata[j], rawdata[j+1], rawdata[j+2], rawdata[j-1], rawdata[j+3]);
    var f0p = leftslopes[0]*realwidth;
    var f1p = rightslopes[0]*realwidth;
    var f0dp = leftslopes[1]*realwidth*realwidth;
    var f1dp = rightslopes[1]*realwidth*realwidth;
    var f = this.getPoly(rawdata[j][1], f0p, f0dp, rawdata[j+1][1], f1p, f1dp);
    var incr = this.dotpitch/realwidth;
    for (var dx = 0; dx < 1; dx += incr){
      d1.push([dx*realwidth + rawdata[j][0], f(dx)]);
    }
  }
  rawdata.shift();
  rawdata.shift();
  rawdata.pop();
  rawdata.pop();

  return d1;
}

function getPoly2(f0, f0p, f0dp, f1, f1p, f1dp){
  var c0, c1, c2, c3, c4,c5, a, b, c;
  c0 = f0; c1 = f0p; c2 = f0dp/2; 
  a = f1 - c0 - c1 - c2;
  b = f1p - 2*c2 - c1;
  c = f1dp - 2*c2;
  c3 = 10*a - 4*b + c/2;
  c4 = -15*a + 7*b -c;
  c5 = 6*a - 3*b +c/2;
  return function(x){
    return c5*x*x*x*x*x + c4*x*x*x*x + c3*x*x*x + c2*x*x + c1*x + c0;
  };
}

function getPoly1(f0, f0p, f0dp, f1, f1p, f1dp){
  var c0, c1, c2, c3, a, b, c;
  c0 = f0; c1 = f0p;
  a = f1-c0-c1;
  b = f1p-c1;
  c2 = 3*a-b;
  c3 = -2*a+b;
  return function(x){
    return c3*x*x*x + c2*x*x + c1*x + c0;
  }

}

PlotSmoother.prototype.setSmootherCoef = setSmootherCoef;
PlotSmoother.prototype.setSlopeType = setSlopeType;
PlotSmoother.prototype.setDiffDegree = setDiffDegree;
PlotSmoother.prototype.getSlopesFrom3P = getSlopesFrom3P;
PlotSmoother.prototype.setSane = setSane;
PlotSmoother.prototype.setDotPitch = setDotPitch;
PlotSmoother.prototype.smooth = smooth;
 
