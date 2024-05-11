// Interval variables for toast notifications
let intervalStaff;
let intervalDriver;

// Arrays for objects
const staffMembers = [];
const deliveryDrivers = [];

// Classes
class Employee {
    constructor(jsObject) {
        this.name = jsObject.name.first;
        this.surname = jsObject.name.last;
    }
}

class StaffMember extends Employee {
    constructor(jsObject) {
        super(jsObject);
        this.picture = jsObject.picture.medium;
        this.email = jsObject.email;
        this.status = "In";
        this.outTime = jsObject.outTime;
        this.duration = jsObject.duration;
        this.returnTime = jsObject.returnTime;
    }

    staffMemberIsLate() {
        this.isLate = false;
        
        if (!intervalStaff) {
            intervalStaff = setInterval(() => {
                const now = new Date();

                if (staffMembers.every(member => member.status === "In") && intervalStaff) {
                    clearInterval(intervalStaff);
                    intervalStaff = null;
                }
                staffMembers.forEach((member) => {
                    if (member.returnTime < now && !member.isLate) {  
                        const staffMembersToast = new StaffMemberToast(member);
                        staffMembersToast.createToast();
                        staffMembersToast.show();
    
                        member.isLate = true;
                    }
                });
                
            }, 1000);
        }
    }
}

class DeliveryDriver extends Employee {
    constructor(jsObject) {
        super(jsObject);
        this.vehicle = jsObject.vehicle;
        this.telephone = jsObject.telephone;
        this.deliverAddress = jsObject.deliverAddress;
        this.returnTime = jsObject.returnTime;
    }

    deliveryDriverIsLate() {
        this.isLate = false;
        
        if (!intervalDriver) {
            intervalDriver = setInterval(() => {
                const now = getNowTime();

                if (deliveryDrivers.length === 0 && intervalDriver) {
                    clearInterval(intervalDriver);
                    intervalDriver = null;
                } 
                deliveryDrivers.forEach((driver) => {
                    if (driver.returnTime <= now && !driver.isLate) {
                        const deliveryDriverToast = new DeliveryDriverToast(driver);
                        deliveryDriverToast.createToast();
                        deliveryDriverToast.show();
    
                        driver.isLate = true;
                    }
                });
                
            }, 1000);
        }
    }
}
/**********************************************************************************************************/

// Staff Member Information
$(document).ready(function() {
    function staffUserGet() {
        $.ajax({
            url: "https://randomuser.me/api/?results=5",
            success: function(data) {
                for (let i = 0; i < 5; i++) {
                    const newStaffMember = new StaffMember(data.results[i]);

                    const newRow = $("<tr>").append(
                        $("<td>").html('<img src="' + newStaffMember.picture + '" alt="">'),
                        $("<td>").text(newStaffMember.name),
                        $("<td>").text(newStaffMember.surname),
                        $("<td>").text(newStaffMember.email),
                        $("<td>").text(newStaffMember.status),
                        $("<td>").text(""),
                        $("<td>").text(""),
                        $("<td>").text("")
                    );

                    $("#staffTable tbody").append(newRow);

                    staffMembers.push(newStaffMember);
                }
            }
        });
    }
    staffUserGet();
});

// Selector
$(document).ready(function() {
    let isGreen = false;

    function selectorTool() {
        if (isGreen) {
            $(this).css("background-color", "").removeClass("selectedRow");
        } else {
            $(this).css("background-color", "#198754").addClass("selectedRow");
        }
        isGreen = !isGreen;
    }
    $("#staffTable, #deliveryBoard").on("click dblclick", "tbody tr", selectorTool);
});

// Hover color change
$(document).ready(function() {
    let isHovering = false;

    function hoverColorChange() {
        if (!$(this).hasClass("selectedRow")) {
            if (isHovering) {
                $(this).css("background-color", "");
            } else {
                $(this).css("background-color", "#5bacbc");
            }
        }
    isHovering = !isHovering;
    }
    $("#staffTable, #deliveryBoard").on("mouseenter mouseleave", "tbody tr", hoverColorChange);
});

/**********************************************************************************************************/
/********* Staff Member Out-of-Office Logging *********/

// Staff Out function
function staffOut() {
    const selectedRow = $("#staffTable tr.selectedRow");

    if (selectedRow.length == 1) {
        const row = selectedRow.first();
        const name = row.find("td:eq(1)").text();
        const surname = row.find("td:eq(2)").text();
        const selectedStaffMember = staffMembers.find(member => member.name === name && member.surname === surname);

        Swal.fire({
            title: `Enter out-time for ${selectedStaffMember.name} in minutes:`,
            inputLabel: "Please enter a number:",
            input: "text",
            showCancelButton: true,
            confirmButtonText: "Submit",
            cancelButtonColor: "#dc3545",
            confirmButtonColor: "#198754"
        }).then((result) => {
            const minutes = parseFloat(result.value);

            if (!isNaN(minutes) && minutes > 0) {
                selectedStaffMember.status = "Out";
                selectedStaffMember.outTime = getNowTime();
                selectedStaffMember.duration = minutesToHours(minutes);
                selectedStaffMember.returnTime = getExpectedReturnTime(minutes);

                row.find("td:eq(4)").html(selectedStaffMember.status);
                row.find("td:eq(5)").html(selectedStaffMember.outTime);
                row.find("td:eq(6)").html(selectedStaffMember.duration);
                row.find("td:eq(7)").html(selectedStaffMember.returnTime);
                row.css("background-color", "").removeClass("selectedRow");

                selectedStaffMember.returnTime = addSecondsToCurrentTime(minutes);
                selectedStaffMember.staffMemberIsLate();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Please provide a valid positive number!",
                    confirmButtonColor: "#198754"
                });
            }
        });
    } else {
        const errorMessage =
            selectedRow.length > 1
            ? "Please select only one Staff Member at a time!"
            : "Please select a Staff Member!"

        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: errorMessage,
            confirmButtonColor: "#198754"
        });
    }
}

// Staff In function
function staffIn() {
    const selectedRow = $("#staffTable tr.selectedRow");

    if (selectedRow.length === 1) {
        const name = selectedRow.find("td:eq(1)").text();
        const surname = selectedRow.find("td:eq(2)").text();
    
        const selectedStaffMember = staffMembers.find(member => member.name === name && member.surname === surname);

        if (selectedStaffMember.status === "In") {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "This Staff Member is already in!",
                confirmButtonColor: "#198754"
            });
        } else {
            selectedRow.find("td:eq(4)").html("In");
            selectedRow.find("td:eq(5), td:eq(6), td:eq(7)").empty();
            selectedRow.css("background-color", "").removeClass("selectedRow");

            delete selectedStaffMember.isLate;
            
            selectedStaffMember.status = "In";
            selectedStaffMember.outTime = undefined;
            selectedStaffMember.duration = undefined;
            selectedStaffMember.returnTime = undefined;
        }
    } else {
        const errorMessage =
            selectedRow.length > 1
                ? "Please select only one Staff Member at a time!"
                : "Please select a Staff Member!";

        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: errorMessage,
            confirmButtonColor: "#198754"
        });
    }
}

/**********************************************************************************************************/

/********* Deliveries Tracking *********/
// Vehicle icons
let driversVehicle = '<i class="fa-solid fa-car"></i> Car'

function selectVehicle(vehicleType) {
    let vehicleDropdownButton = $("#vehicleDropdown");
    
    if (vehicleType === "Motorcycle") {
        driversVehicle = '<i class="fa-solid fa-motorcycle"></i> Motorcycle';
    } else {
        driversVehicle = '<i class="fa-solid fa-car"></i> Car';
    }
    vehicleDropdownButton.html(driversVehicle);
}

// Add Delivery function
function addDelivery() {
    const name = $("#name").val();
    const surname = $("#surname").val();
    const vehicle = driversVehicle;
    const telephone = $("#telephone").val();
    const address = $("#address").val();
    const returnTime = $("#returnTime").val();
    
    const deliveryDriverObject = {
        name: {
            first: name,
            last: surname
        },
        vehicle: vehicle,
        telephone: telephone,
        deliverAddress: address,
        returnTime:returnTime
    };
    
    const newDeliveryDriver = new DeliveryDriver(deliveryDriverObject);

    let isValid = validateDelivery(name, surname, telephone, address, returnTime);

    if (isValid) {
        const newRow = $("<tr>").append(
            $("<td>").html(newDeliveryDriver.vehicle),
            $("<td>").text(newDeliveryDriver.name),
            $("<td>").text(newDeliveryDriver.surname),
            $("<td>").text(newDeliveryDriver.telephone),
            $("<td>").text(newDeliveryDriver.deliverAddress),
            $("<td>").text(newDeliveryDriver.returnTime)
        );

        $("#deliveryBoard tbody").append(newRow);

        $("#vehicleDropdown").html('<i class="fa-solid fa-car"></i> Car');
        $("#name, #surname, #telephone, #address, #returnTime").val("");
        
        deliveryDrivers.push(newDeliveryDriver);
        newDeliveryDriver.deliveryDriverIsLate();
    }
}

// Validate Delivery function
function validateDelivery(name, surname, telephone, address, returnTime) {
    let emptyFields = [];
    
    const showError = (errorMessage) => {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: errorMessage,
            confirmButtonColor: "#198754"
        });
        return false;
    };
    
    if (!name) {
        emptyFields.push("Name");
    } else if (!/^[a-zA-Z]+$/.test(name)) {
        return showError("Please only use letters in the first name!");
    }

    if (!surname) {
        emptyFields.push("Surname");
    } else if (!/^[a-zA-Z]+$/.test(surname)) {
        return showError("Please only use letters in the last name!");
    }

    if (!telephone) {
        emptyFields.push("Telephone");
    } else if (isNaN(telephone) || telephone.length < 7) {
        return showError("Telephone number must be at least 7 digits & only digits!");
    }
  
    if (!address) {
        emptyFields.push("Address");
    } else if (!/[a-z]/gi.test(address) || !/[0-9]/g.test(address)) {
        return showError("Please provide a proper address!");
    }
    
    let timeDifference = calculateRemainingMinutes(returnTime);
    if (!returnTime) {
        emptyFields.push("Return time");
    } else if (timeDifference < 0){
        return showError("The return time can not be in the past. Please select a future time!");
    }

    if (emptyFields.length > 0) {
        return showError(emptyFields.join(", ") + " field required!")
    } else {
        Swal.fire({
            icon: "success",
            title: `Delivery for ${returnTime} added`,
            showConfirmButton: false,
            timer: 1500
        });
        return true;
    }
}

// Clear Delivery function
function clearDelivery() {
    const selectedRow = $("#deliveryBoard tr.selectedRow");
    
    if (selectedRow.length == 1) {
        Swal.fire({
            title: "Are you sure you want to remove this delivery driver?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Confirm",
            cancelButtonColor: "#dc3545",
            confirmButtonColor: "#198754"
        }).then((result) => {
            if (result.isConfirmed) {
                let rowIndex = selectedRow.index();
                
                deliveryDrivers.splice(rowIndex, 1);
                selectedRow.remove();
            } else {
                $(selectedRow).css("background-color", "").removeClass("selectedRow");
            }
        });
    } else {
        const errorMessage =
            selectedRow.length > 1
                ? "Please select only one Delivery Driver at a time!"
                : "Please select a Delivery Driver!";

        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: errorMessage,
            confirmButtonColor: "#198754"
        });
    }
}
/**********************************************************************************************************/

// Toast notification
class Toast {
    constructor() {
        this.newToast = $("#lateToast").clone();
    }

    createToast() {
        $("body").append(this.newToast);
    }

    show() {
        this.newToast.toast("show");
    }
}

class StaffMemberToast extends Toast {
    constructor(jsObject) {
        super();
        this.name = jsObject.name;
        this.surname = jsObject.surname;
        this.picture = jsObject.picture;
        this.duration = jsObject.duration;
    }

    createToast() {
        super.createToast();

        const textContent = `
            <div class="d-flex align-items-center">
                <img src="${this.picture}" alt="Staff Member">
                <div class="ms-2">Name: ${this.name} ${this.surname} is delayed.</div>
            </div>
            <strong class="mt-2">Time out-of-office: ${this.duration}</strong>
        `;

        this.newToast.find(".toast-body").append(textContent);
        this.newToast.find("#toastTitle").append("Staff Delay Alert!");
    }
}

class DeliveryDriverToast extends Toast {
    constructor(jsObject) {
        super();
        this.name = jsObject.name;
        this.surname = jsObject.surname;
        this.address = jsObject.deliverAddress;
        this.telephone = jsObject.telephone;
        this.returnTime = jsObject.returnTime;
    }

    createToast() {
        super.createToast();

        const textContent = `
            <div>Name: ${this.name} ${this.surname} is delayed.</div>
            <div>Address: ${this.address}</div>
            <div>Telephone: ${this.telephone}</div>
            <strong>Estimated return time: ${this.returnTime}</strong>
        `;

        this.newToast.find(".toast-body").append(textContent);
        this.newToast.find("#toastTitle").append("Delivery Driver Delay Alert!");
    }
}
/**********************************************************************************************************/

// Time Converters
function getNowTime() {
    const now = new Date();
    const formattedTime =
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return formattedTime;
}

function minutesToHours(numbers) {
    let hours = Math.floor(numbers / 60);
    let minutes = numbers % 60;
    return (`${hours} hr : ${minutes} min`);
}

function getExpectedReturnTime(minutes) {
    const now = new Date()
    now.setMinutes(now.getMinutes() + minutes);

    const formattedTime =
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return formattedTime;
}

function addSecondsToCurrentTime(minutes) {
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutes * 60000);
    return futureTime;
}

function calculateRemainingMinutes(returnTime) {
    const now = new Date();
    const nowMilliSec = 
        now.getHours() * 60 * 60 * 1000 +                 
        now.getMinutes() * 60 * 1000 +                  
        now.getSeconds() * 1000 +                 
        now.getMilliseconds();

    const inputTimeArray = returnTime.split(":");
    const thenHours = parseInt(inputTimeArray[0]);
    const thenMinutes = parseInt(inputTimeArray[1]);
    
    const thenMilliSec = thenHours * 60 * 60 * 1000 + thenMinutes * 60 * 1000;
    
    const timeDifference = thenMilliSec - nowMilliSec;
    return timeDifference;
}
/**********************************************************************************************************/

// Digital Clock
$(document).ready(function() {
    function digitalClock() {
        const monthNames =[
            "January","February","March","April","May","June","July",
            "August","September","October","November","December"
        ];

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const month = monthNames[now.getMonth()];
        const day = now.getDate();
        const year = now.getFullYear();

        const formattedHours = (hours < 10 ? "0" : "") + hours;
        const formattedMinutes = (minutes < 10 ? "0" : "") + minutes;
        const formattedSeconds = (seconds < 10 ? "0" : "") + seconds;

        $("#clock").text(`DATE ${day} ${month} ${year} TIME ${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    }
    setInterval(digitalClock, 1000);

    digitalClock();
});