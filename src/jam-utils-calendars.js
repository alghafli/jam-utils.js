//calendar utils-----------------------------------------------------------------

/*
:Date: 2025-01-24

:Version: 2.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Calendar converter. mainly made to convert between gregorian and islamic
calendars.

to convert a javascript date object:
    let my_date = new Date();
    let islamic_date = JamUtils.calendars.from_native(my_date, 'islamic');
    //now islamic_date is an object with properties {year, month, day} after
    //conversion to islamic date.

to convert an object of {year, month, day} to javascript date object:
    let islamic_date = {year: 1440, month: 10, day: 13};
    let my_date = JamUtils.calendars.to_native(islamic_date, 'islamic');

to convert an object of {year, month, day} from calendar to calendar:
    let islamic_date = {year: 1440, month: 10, day: 13};
    let gregorian_date = JamUtils.calendars.convert(islamic_date, 'islamic', 'gregorian');
    //converts from islamic to gregorian.
*/

JamUtils.calendars = {
    NATIVE_CALENDAR: 'gregory',
    
    MULTIPLIERS: {
        'year': ['min_days', 'min_months'],
        'month': ['min_days'],
        'day': [],
    },
    
    calendars: {
        gregory: {
            min_days: 28,
            min_months: 12,
        },
        islamic: {
            min_days: 29,
            min_months: 12,
        },
        'islamic-umalqura': {
            min_days: 29,
            min_months: 12,
        },
        'islamic-tbla': {
            min_days: 29,
            min_months: 12,
        },
        'islamic-civil': {
            min_days: 29,
            min_months: 12,
        },
        'islamic-rgsa': {
            min_days: 29,
            min_months: 12,
        },
        persian: {
            min_days: 29,
            min_months: 12,
        },
    },
    
    add(name, min_days, min_months) {
        this.calendars[name] = {min_days, min_months};
    },
    
    delete(name) {
        delete this.calendars[name];
    },
    
    convert(date, source='gregory', target='islamic') {
        let native_date = this.to_native(date, source);
        return this.from_native(native_date, target);
    },
    
    to_native(date, calendar) {
        if (calendar == this.NATIVE_CALENDAR) {
            return new Date(date.year, date.month - 1, date.day);
        }
        
        let today = new Date();
        let result = {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
        };
        
        let converter = Intl.DateTimeFormat('en', {calendar: calendar});
        
        for (let part of ['year', 'month', 'day']) {
            let error = Number.POSITIVE_INFINITY;
            //cycles would probably be very few.
            //setting max cycles only to discover bugs in the loop.
            for (let cycles = 10;error != 0;cycles--) {
                if (cycles <= 0) {
                    let msg = 'max approximation cycles exceeded. ' +
                        'is date conversion buggy?';
                }
                
                let native_date = new Date(
                    result.year,
                    result.month - 1,
                    result.day
                );
                
                let approx = {};
                converter.formatToParts(native_date).forEach(
                    obj => {
                        approx[obj.type] = Number(obj.value);
                    }
                );
                
                error = date[part] - approx[part];
                
                result.year = native_date.getFullYear();
                result.month = native_date.getMonth() + 1;
                result.day = native_date.getDate();
                
                for (let multiplier of this.MULTIPLIERS[part]) {
                    error *= this.calendars[calendar][multiplier];
                }
                
                result.day += error;
            }
        }
        
        return new Date(result.year, result.month - 1, result.day);
    },
    
    from_native(date, calendar) {
        let converter = Intl.DateTimeFormat('en', {calendar: calendar});
        let converted = {};
        converter.formatToParts(date).forEach(
            obj => {
                converted[obj.type] = Number(obj.value);
            }
        );
        
        return {
            year: converted.year,
            month: converted.month,
            day: converted.day
        };
    }
};

