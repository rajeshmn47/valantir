function mergesort(nums) {
    if (nums.length == 1) {
        //console.log(nums)
        return nums
    }
    let mid = Math.ceil(nums.length / 2)
    let left = nums.slice(0, mid)
    let right = nums.slice(mid, nums.length)
    //console.log(left, right)
    return merge(mergesort(left), mergesort(right))
}

function merge(arr1, arr2) {
    console.log("grr", arr1, arr2, "arr")
    let merged = []
    let i = 0;
    let j = 0;
    if (!arr1 || !arr2) {
        return []
    }
    if ((!arr1) || arr1?.length == 0) {
        if (arr2?.length > 0) {
            return arr2
        }
    }
    if ((!arr2) || arr2?.length == 0) {
        if (arr1?.length > 0) {
            return arr2
        }
    }
    while (i < arr1.length && j < arr2.length)
        if (arr1[i] < arr2[j]) {
            merged.push(arr1[i])
            i++
        }
        else {
            merged.push(arr2[j])
            j++
        }
    merged.push(...arr1.slice(i, arr1.length))
    merged.push(...arr2.slice(j, arr2.length))
    console.log(merged, "merged")
    return merged;
}

let arr = [1, 3, 1, 2, 5, 13, 14, 6, 2, 1, 12, 23, 15, 17, 11]

console.log(mergesort(arr), "urged")

function quicksort(nums) {
    if (nums.length <= 1) {
        return nums
    }
    let p = nums[nums.length - 1]
    let left = []
    let right = []
    for (let i = 0; i < nums.length-1; i++) {
        if (nums[i] > p) {
            left.push(nums[i])
        }
        else {
            right.push(nums[i])
        }
    }
    return [...quicksort(left), p, ...quicksort(right)]
}

console.log(quicksort([1, 3, 1, 2, 5, 13, 14, 6, 2, 1, 12, 23, 15, 17, 11]))