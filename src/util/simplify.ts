export type Point = number[];

// Simplify is an in-place* implementation of Ramer–Douglas–Peucker.
export function Simplify(points: Point[], epsilon: number): Point[] {
	epsilon = Math.abs(epsilon); // errors are absolute

	// *makes copy
	return points.slice(0, compress(points, 0, points.length, epsilon));
}

function compress(
	points: Point[],
	start: number,
	stop: number,
	epsilon: number
): number {
	const end: number = stop - start;

	if (end < 3) {
		// return points
		return end;
	}

	// Find the point with the maximum distance
	const first: Point = points[start];
	const last: Point = points[stop - 1];

	const flDist: number = distance(first, last);
	const flCross: number = first[0] * last[1] - first[1] * last[0];

	let dmax: number = 0.0;
	let index: number = 0;

	for (let i = 2; i < end - 1; i++) {
		const d: number = perpendicularDistance(
			points[start + i],
			first,
			last,
			flDist,
			flCross
		);
		if (dmax < d) {
			dmax = d;
			index = i;
		}
	}

	// If max distance is lte to epsilon, return segment containing
	// the first and last points.
	if (dmax <= epsilon) {
		points[start + 1] = last;
		return 2;
	}

	index += start;

	// Recursive call
	const r1: number = compress(points, start, index + 1, epsilon);
	const r2: number = compress(points, index, stop, epsilon);

	// Build the result list
	const x: number = r1 - 1;
	for (let i = 0; i < r2; i++) {
		points[start + x + i] = points[index + i];
	}

	return x + r2;
}

function distance(a: Point, b: Point): number {
	const x: number = a[0] - b[0];
	const y: number = a[1] - b[1];
	return Math.sqrt(x * x + y * y);
}

function perpendicularDistance(
	p: Point,
	fp: Point,
	lp: Point,
	dist: number,
	cross: number
): number {
	return (
		Math.abs(
			cross + lp[0] * p[1] + p[0] * fp[1] - p[0] * lp[1] - fp[0] * p[1]
		) / dist
	);
}
