#include <bits/stdc++.h>
using namespace std;

int alt1 = 20;
int size1 = 10;
double minx = INT_MAX, miny = INT_MAX, maxx = INT_MIN, maxy = INT_MIN;
vector<pair<double, double>> trajectory;
vector<pair<double, double>> gridCorners;

int sidegen(int alt) {
    return (size1 * alt) / alt1;
}

void ordergen(vector<pair<double, double>>& pts, double px, double py) {
    sort(pts.begin(), pts.end(), [&](pair<double, double> a, pair<double, double> b) {
        double ang1 = atan2(a.second - py, a.first - px);
        double ang2 = atan2(b.second - py, b.first - px);
        return ang1 < ang2;
    });
    pts.push_back(pts[0]);
}

bool isPointInPolygon(double x, double y, vector<pair<double, double>>& poly) {
    int n = poly.size();
    bool inside = false;
    
    for (int i = 0, j = n - 1; i < n; j = i++) {
        double xi = poly[i].first, yi = poly[i].second;
        double xj = poly[j].first, yj = poly[j].second;
        
        if ((x == xi && y == yi) || (x == xj && y == yj)) return true;
        
        if ((yi == yj) && (yi == y) && (x > min(xi, xj)) && (x < max(xi, xj))) return true;
        
        if ((xi == xj) && (xi == x) && (y > min(yi, yj)) && (y < max(yi, yj))) return true;
        
        bool intersect = ((yi > y) != (yj > y)) && 
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

void findGridCornersInPolygon(vector<pair<double, double>>& poly, int side) {
    gridCorners.clear();
    
    // Use the shifted coordinates for grid generation
    double startX = minx - side;
    double endX = maxx + side;
    double startY = miny - side;
    double endY = maxy + side;
    
    for (double x = startX; x <= endX; x += side) {
        for (double y = startY; y <= endY; y += side) {
            if (isPointInPolygon(x, y, poly)) {
                gridCorners.push_back({x, y});
            }
        }
    }
}

void trajgen(const vector<vector<int>>& xarray, const vector<vector<int>>& yarray, 
             const vector<pair<double, double>>& pts) {
    trajectory.clear();
    
    for (int i = 0; i < pts.size() - 1; i++) {
        if (pts[i + 1].first - pts[i].first == 0) {
            for (auto it : xarray[i]) {
                trajectory.push_back({(double)it, pts[i].second});
            }
            for (auto it : yarray[i]) {
                trajectory.push_back({pts[i].first, (double)it});
            }
        } else {
            double m = (pts[i + 1].second - pts[i].second) / 
                       (pts[i + 1].first - pts[i].first);
            
            for (auto it : xarray[i]) {
                double y = pts[i].second + m * ((double)it - pts[i].first);
                trajectory.push_back({(double)it, y});
            }
            for (auto it : yarray[i]) {
                double x = pts[i].first + ((double)it - pts[i].second) / m;
                trajectory.push_back({x, (double)it});
            }
        }
    }
}

void detectwaypoints(vector<pair<double, double>>& pts, double px, double py, int side) {
    vector<vector<int>> xarray, yarray;
    
    for (int i = 0; i < pts.size() - 1; i++) {
        vector<int> xarrayin;
        vector<int> yarrayin;
        
        double xp = pts[i].first;
        double yp = pts[i].second;
        double xn = pts[i + 1].first;
        double yn = pts[i + 1].second;
        
        int start_x = min(xp, xn);
        int end_x = max(xp, xn);
        int start_y = min(yp, yn);
        int end_y = max(yp, yn);
        
        int gap = start_x % side;
        int bet = start_x + (side - gap);
        while (bet <= end_x) {
            xarrayin.push_back(bet);
            bet += side;
        }
        
        gap = start_y % side;
        bet = start_y + (side - gap);
        while (bet <= end_y) {
            yarrayin.push_back(bet);
            bet += side;
        }
        
        xarray.push_back(xarrayin);
        yarray.push_back(yarrayin);
    }
    
    trajgen(xarray, yarray, pts);
}

vector<pair<double, double>> removeDuplicatesAndSort(const vector<pair<double, double>>& points) {
    if (points.empty()) return {};
    
    set<pair<double, double>> uniquePoints(points.begin(), points.end());
    vector<pair<double, double>> result(uniquePoints.begin(), uniquePoints.end());
    
    sort(result.begin(), result.end(), [](const pair<double, double>& a, const pair<double, double>& b) {
        if (a.first == b.first) {
            return a.second < b.second;
        }
        return a.first < b.first;
    });
    
    return result;
}

int main() {
    vector<pair<double, double>> pts;
    int num;
    cin >> num;
    double xc = 0, yc = 0;
    
    // Read points and find bounds
    while (num) {
        double px, py;
        cin >> px >> py;
        minx = min(minx, px);
        maxx = max(maxx, px);
        miny = min(miny, py);
        maxy = max(maxy, py);
        pts.push_back({px, py});
        xc += px;
        yc += py;
        num--;
    }
    
    // Calculate centroid
    xc /= (double)pts.size();
    yc /= (double)pts.size();
    
    int alt;
    cin >> alt;
    int side = sidegen(alt);
    
    // Create a working copy of points for polygon operations
    vector<pair<double, double>> polyPoints = pts;
    ordergen(polyPoints, xc, yc);
    
    // Find grid corners using original coordinates
    findGridCornersInPolygon(polyPoints, side);
    
    // Create shifted points for waypoint detection
    vector<pair<double, double>> shiftedPts;
    for (auto &it : pts) {
        shiftedPts.push_back({it.first - minx, it.second - miny});
    }
    
    // Recalculate centroid for shifted points
    double sxc = 0, syc = 0;
    for (auto &it : shiftedPts) {
        sxc += it.first;
        syc += it.second;
    }
    sxc /= shiftedPts.size();
    syc /= shiftedPts.size();
    
    ordergen(shiftedPts, sxc, syc);
    detectwaypoints(shiftedPts, sxc, syc, side);
    
    // Combine all points
    vector<pair<double, double>> allPoints;
    allPoints.insert(allPoints.end(), gridCorners.begin(), gridCorners.end());
    
    // Shift trajectory points back to original coordinates
    for (auto &point : trajectory) {
        allPoints.push_back({point.first + minx, point.second + miny});
    }
    
    vector<pair<double, double>> finalPoints = removeDuplicatesAndSort(allPoints);
    vector<pair<double, double>> finalanswer;

    // Group by x-coordinate
    map<int, vector<pair<double, double>>> mp;
    vector<vector<pair<double, double>>> groups;

    for(auto &p : finalPoints) {
        mp[(int)p.first].push_back(p);
    }

    for(auto &g : mp) {
        groups.push_back(g.second);
    }

    // Reverse alternate groups
    for(int i = 0; i < groups.size(); i += 2) {
        reverse(groups[i].begin(), groups[i].end());
    }

    for(auto it : groups) {
        finalanswer.insert(finalanswer.end(), it.begin(), it.end());
    }
       
    cout << fixed << setprecision(1);
    for (auto p : finalanswer) {
        cout << p.first << " " << p.second << endl;
    }
    
    return 0;
}