# Returns Playbook

## Current Sample Size

- Candidate replies: 73
- Strong examples: 16

## Common Tags

- WF Sales
- Complete
- DualPlus
- WF Support
- QuadPro

## Likely SOP References

- Cel-Fi GO X Warranty Process (PSU Only) (knowledge\approved\sops\Cel-Fi GO X Warranty Process (PSU Only) 35ac6ce4f1de42499026277c04caf687.md)
- Exchanges in WeSupply (knowledge\approved\sops\Exchanges in WeSupply f66c1d4ba675484081c19dd7656a85ea.md)
- FAQ's and Best Practices (knowledge\approved\sops\FAQ's and Best Practices 9eb82d880a4c4e16a3d0b8c5bffd113f.md)
- FAQ & Best Practices for WeSupply (knowledge\approved\sops\FAQ & Best Practices for WeSupply 5056f4385db64d71aea3f5b2ff33f011.md)
- Return Shipping Labels (knowledge\approved\sops\Return Shipping Labels 43ec7eca7a99469081792dd6cfea9efa.md)

## Example Reply Patterns

> Hello Raiyan,
> 
> Thank you for reaching out to us. I'd be happy to help.
> 
> Could you please clarify—does the outdoor antenna not receive any signal at all, or is it receiving a signal but you’re just not seeing any boost?
> 
> If it’s not receiving a stable and usable signal, you could try moving the outdoor antenna to a different spot. I'd suggest also checking if the signal is stable because if it's fluctuating (changing every minute/second) then the booster's performance will also fluctuate. If it's not stable or the signal is borderline, it's best to move it to another spot and see where you can get a more stable and good signal to allow the booster to operate. 
> 
> You can check the signal levels from the metrics. In the Wave App under the Activity Tab there's a section labeled "Superchannels", showing which frequency band is being boosted on Radio A and B. If you tap on one of them you'll see a detailed list of performance metrics appear. The main values we're concerned with would be the "Donor RSRP" which indicates signal strength and "Donor SINR" which indicates signal quality.
> 
> Firstly we want to ensure that the Donor RSRP is close to -115 dBm and above (with closer to zero being better) as the GO X is capable of boosting signals as weak as -120 dBm. We add the buffer to ensure that even if signal fluctuations occur, the donor RSRP wouldn't drop below -120 dBm.
> 
> Secondly we want to ensure that we have at least a positive value for the Donor SINR, but we recommend values of +3 to +6 dB and stable.
> 
> As you relocate/rotate the antenna you'll be able to see how these values change in real time in order to find the best direction. Now if you're able to find a direction yielding the previously mentioned results for one of Radio A or Radio B, that should be a good starting point for the location of the antenna outdoors. 
> 
> If it is receiving a good and stable signal, but your phones aren’t getting the boost, try standing next to the indoor antenna to force your phones to use the signal coming from the booster. This just means your phones were using signals from the towers, so standing by the indoor antenna helps them switch to the booster’s signal. After that, you should notice a difference. Make sure to restart your phones while next to the indoor antenna, not just standing nearby.
> 
> Best,

> Hi Raiyan,
> 
> Thank you for your response. I checked the signal levels and logs on the Cel-Fi GO X, and it's using bands 2 and 4, so it's not boosting band 13. You can select band 13 from the app if you wish. However, you may need to find a better location where the outdoor antenna receives that band specifically.
> 
> From the logs from yesterday, the only bands that were being boosted on the app were bands 2 and 4:
> 
> If the application you're using the boosters for can only work for band 13, then please share your location address, and I can send you the tower map to help you find a better location to specifically receive band 13. 
> 
> Just to clarify, the Cel-Fi GO X provides up to 100 dB of gain, while the Amazboost offers up to 72 dB. This difference is due to FCC regulations: single-carrier boosters are allowed up to 100 dB of gain, whereas multi-carrier boosters are limited to a maximum of 72 dB. 
> 
> Below are the specs for the Cel-Fi GO X:
> [url]
> 
> Below are the specs for the Amazboost:
> 
> [url]
> 
> Regarding the app, we strongly suggest Signal Stream since it shows the indoor SINR and all the other metrics, so it gives a better idea of the signal the phone is receiving. 
> 
> Best,

> Hi Clayton,
> 
> Thank you for reaching out to us. I'd be happy to help.
> 
> Regarding the discount, I'd like to check with my manager, and get back to you. In the meantime, I'd suggest trying the antennas first since you do have the gateways. For the return date we can extend it to 120 days instead of 90, it wouldn't be an issue.
> 
> Just a couple of quick notes on the gateways:
> 
> For the G5AR, it requires two QuadPros, not just one, since it has 8 internal ports. You would also need to open it up and connect the antennas from the inside, as shown here:
> 
> [url]
> 
> For the G4AR, it can work with just one QuadPro because it only has 4 ports. You would need to switch it to external mode, as shown here:
> 
> [url]
> 
> If you can share your location address, I can share the towers in your area to help you aim the antenna. Another side note: higher isn’t always better, often, lower locations can actually perform better, as they’re more shielded from interfering towers by the walls of the house. Thus, It’s worth testing different positions/heights before doing any permanent installation.
> 
> Best,
