"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayUtil = {
    shuffle(arr) {
        let currentIndex = arr.length;
        let temporaryValue;
        let randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = arr[currentIndex];
            arr[currentIndex] = arr[randomIndex];
            arr[randomIndex] = temporaryValue;
        }
        return arr;
    },
    unify(arr1, arr2, base) {
        let arr3 = [...arr2];
        let inn;
        for (let i = 0; i < arr1.length; i++) {
            inn = false;
            for (let j = 0; j < arr2.length; j++) {
                if (base && arr1[i][base] == arr2[j].base) {
                    inn = true;
                    break;
                }
                else if (arr1[i] == arr2[j]) {
                    inn = true;
                    break;
                }
            }
            if (!inn) {
                arr3.push(arr1[i]);
                continue;
            }
            inn = false;
        }
        return arr3;
    },
    similers(arr1, arr2, base) {
        let arr3 = [];
        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
                if (base && arr1[i][base] == arr2[j].base) {
                    arr3.push(arr1[i]);
                    break;
                }
                else if (arr1[i] == arr2[j]) {
                    arr3.push(arr1[i]);
                    break;
                }
            }
        }
        return arr3;
    },
    subtract(arr1, arr2, base) {
        let arr3 = [...arr1];
        let x = 0;
        ;
        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
                if (base && arr1[i][base] == arr2[j].base) {
                    arr3.splice(i - x, 1);
                    x++;
                    break;
                }
                else if (arr1[i] == arr2[j]) {
                    arr3.splice(i - x, 1);
                    x++;
                    break;
                }
            }
        }
        return arr3;
    }
};
//# sourceMappingURL=array.js.map