class Solution(object):
    def twoSum(self, nums, target):
        done = False
        while not done:
            for i in range(0,len(nums)):
                number = nums[i]
                seek = int(target - number)
                if seek == number:
                    solution = []
                    for i in range(0,len(nums)):