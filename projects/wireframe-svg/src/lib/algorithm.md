# Screen space occluded line culling

1. Take every line and project it to screen space
2. Find the intersection of every line with every other

- discard intersections that occur outside the lines' boundaries
- store the intersections so the complexity is O(n/2) (don't calculate the intersection twice)

3. For each line, replace it with one broken up by intersection
4. For each sub-line, lerp to centre, and test if occluded by casting a ray
5. Group lines by occlusion status, emit to renderer for different styling (occluded might just be omitted, or grey, or dashed etc.)
